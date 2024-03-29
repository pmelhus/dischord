from flask import Blueprint, jsonify, request
from flask_login import login_required
from app.models import db, Server, Channel, User, server_members
from app.forms import ServerForm
from flask import session
from ..utils.s3utils import (
    upload_file_to_s3, allowed_file, get_unique_filename)
from ..utils.row2dict import (row2dict)

server_routes = Blueprint('servers', __name__)


def validation_errors_to_error_messages(validation_errors):
    """
    Simple function that turns the WTForms validation errors into a simple list
    """
    errorMessages = []
    for field in validation_errors:
        for error in validation_errors[field]:
            errorMessages.append(f'{field}:{error}')
    return errorMessages


@server_routes.route('/usersServers/<int:id>')
@login_required
def servers(id):


    # query all server members
    members = db.session.query(server_members).all()
    # iterate through members and if user is in server then push server id to list
    relevant_server_ids = []
    for member in members:
        if member.user_id == id:
            relevant_server_ids.append(member.server_id)
            # print (relevant_servers)
    # write a function that iterates through the relevant members and returns the server if the server id is in the list

    serversTest = Server.query.where(Server.id.in_(relevant_server_ids)).all()

    return {'servers': [server.to_dict() for server in serversTest]}

    # all_servers = Server.query.all()
    # if not id:
    #     return {"servers": [server.to_dict() for server in all_servers]}
    # else:


# @server_routes.route('/loadServer/<int:id>')
# @login_required
# def server(id):
#     server = Server.query.get(id)
#     return server.to_dict()


@server_routes.route('/<int:id>')
@login_required
def get_one_server(id):

    server = Server.query.get(id)

    return {'server': server.to_dict()}

@server_routes.route('/', methods=["POST"])
@login_required
def server_form_submit():
    form = ServerForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    if "image" in request.files:
        image = request.files["image"]
        if not allowed_file(image.filename):
            return {"errors": "file type not permitted"}, 400
        image.filename = get_unique_filename(image.filename)
        upload = upload_file_to_s3(image)
        if "url" not in upload:
            # then the upload le failed, oh no!
            return upload, 400
        url = upload["url"]


        params = {
            "owner_id": form.data['owner_id'],
            "name": form.data['name'],
            "public": form.data['public'],
            "image_url": url
        }
    else:


        params = {
            "owner_id": form.data['owner_id'],
            "name": form.data['name'],
            "public": form.data['public']
        }

    if form.validate_on_submit():
        server = Server(**params)
        print(params)
        user = User.query.get(params['owner_id'])
        db.session.add(server)
        server.members.append(user)
        db.session.commit()


        channel = Channel(**{
            'server_id': server.id,
            'name': 'general',
        })
        db.session.add(channel)
        db.session.commit()

        return server.to_dict()
    else:
        return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@server_routes.route('/<int:id>', methods=["PATCH"])
@login_required
def server_update(id):
    server = Server.query.get(id)
    form = ServerForm()
    form['csrf_token'].data = request.cookies['csrf_token']

    if "image" in request.files:
        image = request.files["image"]
        if not allowed_file(image.filename):
            print("file type not permitted")
            return {"errors": "file type not permitted"}, 400
        image.filename = get_unique_filename(image.filename)
        upload = upload_file_to_s3(image)
        if "url" not in upload:
            # then the upload le failed, oh no!
            return {"errors": "updated failed"}, 400
        url = upload["url"]


    if form.validate_on_submit():
        server.owner_id = form.data['owner_id']
        server.name = form.data['name']
        server.public = form.data['public']
        if "image" in request.files:
            server.image_url = url
        db.session.commit()
        return server.to_dict()
    else:

        return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@server_routes.route('/<int:id>', methods=["DELETE"])
@login_required
def server_delete(id):

    server = Server.query.get(id)
    if not server:
        return {"errors": f"No server with id {id} exists"}, 404
    else:
        db.session.delete(server)
        db.session.commit()
        return server.to_dict()


@server_routes.route('/server_members/<int:server_id>')
@login_required
def get_server_members(server_id):
    server = Server.query.get(server_id)
    if not server:
        return {"errors": "Server doesn't exist"}, 404
    else:
        return server.to_dict()


@server_routes.route('/server_members/<int:user_id>/<int:server_id>')
@login_required

def get_one_server_member(server_id, user_id):
    members = db.session.query(server_members).all()
    for member in members:
        if member.user_id == user_id and member.server_id == server_id:
            return row2dict(member)




@server_routes.route('/server_members/<int:server_id>/<int:user_id>', methods=["POST"])
@login_required
def create_server_member(server_id, user_id):
    server = Server.query.get(server_id)
    user = User.query.get(user_id)

    print(user, 'AHHH')

    if not server and user:
        return {"errors": "Either the server or user does not exist"}, 404

    else:
        print(type(server.members), 'HEREWEGO')
        server.members.append(user)
        db.session.add(server)
        db.session.commit()

        return {"user": user.to_dict(), "server": server.to_dict()}
