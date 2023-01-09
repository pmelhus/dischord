from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.models import db, ChannelMessage, Channel, server_members
from app.forms import ChannelMessageForm

channel_message_routes = Blueprint('channel_messages', __name__)

def validation_errors_to_error_messages(validation_errors):
    """
    Simple function that turns the WTForms validation errors into a simple list
    """
    errorMessages = []
    for field in validation_errors:
        for error in validation_errors[field]:
            errorMessages.append(f'{field}:{error}')
    return errorMessages

@channel_message_routes.route('/', methods=["POST"])
@login_required
def channel_message_submit():

    form = ChannelMessageForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    params = {
        "channel_id": form.data['channel_id'],
        'user_id': form.data['owner_id'],
        "content": form.data['content'],
        "edited": form.data['edited']
    }

    if form.validate_on_submit():
        print('hello')
        channel_message = ChannelMessage(**params)
        db.session.add(channel_message)
        db.session.commit()
        return channel_message.to_dict()
    else:
        return {'errors': validation_errors_to_error_messages(form.errors)}, 401

@channel_message_routes.route('/<int:id>')
@login_required
def get_messages(id):
    members = db.session.query(server_members).all()
    # iterate through members and if user is in server then push server id to list
    relevant_server_ids = []
    for member in members:
        if member.user_id == id:
            relevant_server_ids.append(member.server_id)

    relevant_channel_ids = []
    channels = Channel.query.where(Channel.server_id.in_(relevant_server_ids))
    for channel in channels:
        relevant_channel_ids.append(channel.id)
    print(relevant_channel_ids, 'idsnow')
    channel_messages = ChannelMessage.query.where(ChannelMessage.channel_id.in_(relevant_channel_ids)).all()

    print(channel_messages, 'MESAGE')
    if not len(channel_messages):
        return {"errors": ["No messages to be found"]}
    else:
        return {'channel_messages': [channel_message.to_dict() for channel_message in channel_messages]}

@channel_message_routes.route('/<int:id>', methods=["PATCH"])
@login_required
def message_update(id):

    channel_message = ChannelMessage.query.get(id)
    if not channel_message:
      return {"errors": "No estate"}, 404
    form = ChannelMessageForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    if form.validate_on_submit():
        # print(form.data, 'BETCH')
        channel_message.channel_id = form.data['channel_id']
        channel_message.owner_id = form.data['owner_id']
        channel_message.content = form.data['content']
        channel_message.edited = form.data['edited']
        db.session.commit()
        return channel_message.to_dict()
    else:
        return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@channel_message_routes.route('/<int:id>', methods=["DELETE"])
@login_required
def server_delete(id):
    channel_message = ChannelMessage.query.get(id)
    if not channel_message:
        return {"errors": f"No channel message with id {id} exists"}, 404
    else:
        db.session.delete(channel_message)
        db.session.commit()
        return channel_message.to_dict()
