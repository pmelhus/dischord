from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.models import db, Channel, Server, server_members
from app.forms import ChannelForm


channel_routes = Blueprint('channels', __name__)


def validation_errors_to_error_messages(validation_errors):
    """
    Simple function that turns the WTForms validation errors into a simple list
    """
    errorMessages = []
    for field in validation_errors:
        for error in validation_errors[field]:
            errorMessages.append(f'{field}:{error}')
    return errorMessages


@channel_routes.route('/<int:id>')
@login_required
def channels(id):
    # query all server members
    members = db.session.query(server_members).all()
    # iterate through members and if user is in server then push server id to list

    if members:
        relevant_server_ids = []
        for member in members:
            if member.user_id == id:
                relevant_server_ids.append(member.server_id)
                # print (relevant_servers)
        # write a function that iterates through the relevant members and returns the server if the server id is in the list

        channels = Channel.query.filter(Channel.server_id.in_(relevant_server_ids)).all()
        # channels = Channel.query.all()
        return {'channels': [channel.to_dict() for channel in channels]}
    else:
        channels = Channel.query.filter(Channel.server_id == id)
        return {'channels': [channel.to_dict() for channel in channels]}


@channel_routes.route('/')
@login_required
def all_channels():

    channels = Channel.query.all()
    # channels = Channel.query.all()
    return {'channels': [channel.to_dict() for channel in channels]}


# @channel_routes.route('/server/<int:id>')
# @login_required
# def channel(id):
#     channel = Channel.query.get(id)
#     return channel.to_dict()

@channel_routes.route('/', methods=["POST"])
@login_required
def channel_form_submit():
    form = ChannelForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    params = {
        "server_id": form.data['server_id'],
        "name": form.data['name'],
        "description": form.data['description']
    }

    if form.validate_on_submit():
        channel = Channel(**params)
        db.session.add(channel)
        db.session.commit()
        return channel.to_dict()
    else:
        return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@channel_routes.route('/<int:id>', methods=["PATCH"])
@login_required
def server_update(id):

    channel = Channel.query.get(id)
    form = ChannelForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    if form.validate_on_submit():

        channel.server_id = form.data['server_id']
        channel.name = form.data['name']
        channel.description = form.data['description']
        db.session.commit()
        return channel.to_dict()
    else:

        return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@channel_routes.route('/<int:id>', methods=["DELETE"])
@login_required
def server_delete(id):
    channel = Channel.query.get(id)
    if not channel:
        return {"errors": f"No channel with id {id} exists"}, 404
    else:
        db.session.delete(channel)
        db.session.commit()
        return channel.to_dict()
