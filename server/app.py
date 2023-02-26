""" screen/ Flask App entrypoint."""
import pathlib
from typing import Any, cast, Optional

import flask

from screen_server import db
from screen_server import flask_app
from screen_server import models
from screen_server.storage import storage

# pyright: reportUnknownArgumentType=false

MY_DIR = pathlib.Path(__file__).parent
APP = flask_app.get_app(MY_DIR)
OIDC = flask_app.get_oidc(APP)
STORAGE = storage.StorageService.get_instance(APP.config)

# DB caching functions which need flask.g and the APP variable
def _request_has_connection() -> bool:
  """ Check if a db connection is stored in the global object. """
  return hasattr(flask.g, 'dbconn')

def _get_request_conn():
  """ Get db connection from global object if it exists, or create new one. """
  if not _request_has_connection():
    flask.g.dbconn = db.Db(APP.config['DB_FILE'])

  return flask.g.dbconn

@APP.teardown_request
def _close_db_connection(_): # pyright: reportUnusedFunction=false
  """ Close the db connection on Flask teardown, if it's been created. """
  if _request_has_connection():
    flask.g.dbconn.close()


@APP.cli.command('initdb') # pyright: reportUnknownMemberType=false
def initdb():
  """ CLI command to load the schema. """
  schema_file = MY_DIR / 'schema.sql'
  pathlib.Path(APP.config['DB_FILE']).parent.mkdir(exist_ok=True, parents=True)
  _get_request_conn().load_schema(schema_file)
  print('Loaded database schema from', schema_file)

##### Flask Routes
# SPA HTML
@APP.route('/')
@APP.route('/<imageid:image_id>')
@OIDC.require_login
def spa(image_id: Optional[str] = None) -> flask_app.ResponseType:
  """ Return the index.html for the single page app. """
  return flask.render_template('index.html',
                               user_id=cast(str, OIDC.user_getfield('email')))

# Raw Image
@APP.route('/i/<image_id>.png')
@OIDC.require_login # The actual username is irrelevant if they're logged in.
def get_image_data(image_id: str) -> flask_app.ResponseType:
  """ Returns a screenshot image from the filesystem. """
  img = _get_request_conn().get_image(image_id)

  if not img:
    return "Screenshot Not Found", 404

  # pyright: reportGeneralTypeIssues=false
  return flask.send_file(STORAGE.read_file(img.image_id), mimetype='image/png')

#### API Calls
# Image GET
@APP.route('/api/v1/images/<image_id>', methods=['GET'])
@OIDC.require_login # The actual username is irrelevant if they're logged in.
def get_image(image_id: str) -> flask_app.ResponseType:
  """ Return a JSON-able image from an image_id. """
  img = _get_request_conn().get_image(image_id)
  if not img:
    return {}, 404

  return img.as_dict()

# Image POST
@APP.route('/api/v1/images/', methods=['POST'])
@OIDC.require_login
def new_image() -> flask_app.ResponseType:
  """ Create a new screenshot object from a posted image file. """
  img_file = flask.request.files['img']
  img = models.Image(user_id=cast(str, OIDC.user_getfield('email')),
                     source_url=flask.request.form.get('source_url'))
  _get_request_conn().insert_image(img)

  STORAGE.write_file(img.image_id, img_file)

  return img.as_dict()

# Image PUT
@APP.route('/api/v1/images/<image_id>', methods=['PUT'])
@OIDC.require_login
def update_image(image_id: str) -> flask_app.ResponseType:
  """ Update image in datastore from JSON. """
  # We don't accept image uploads, though we'll have to at some point
  image = models.Image(**cast(dict[str, Any], flask.request.get_json()))
  assert image_id == image.image_id
  # The DB class only updates the record if the user_id matches with what is in
  # the database. This will silently fail otherwise.
  _get_request_conn().update_image(image,
                                   cast(str, OIDC.user_getfield('email')))
  return "Success", 200
