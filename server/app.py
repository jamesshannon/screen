""" screen/ Flask App entrypoint."""
import json
import pathlib
import re
from typing import Any, cast, Optional, Tuple, Union

import flask
import flask_oidc
import werkzeug.routing

from screen_server import db
from screen_server import models
from screen_server.storage import storage

# pyright: reportUnknownArgumentType=false

MY_DIR = pathlib.Path(__file__).parent
# The python package has its own root but static and template folders are at
# the same level as this script
app = flask.Flask(__name__, root_path=str(MY_DIR / 'screen_server'),
                  static_folder=str(MY_DIR / 'static'),
                  template_folder=str(MY_DIR / 'templates'))

# Config, and values in config, are relative to the
app.config.from_file(str(MY_DIR / 'config.json'), load=json.load)

oidc = flask_oidc.OpenIDConnect(app)

STORAGE = storage.StorageService.get_instance(app.config)

# Type definition for view function return values; they can return a handful of
# things and Flask will interpret it correctly
FlaskResponse = Union[
    str, # string, such as page content or a short message
    Tuple[str, int], # Tuple with string (above) plus a status code
    flask.Response, # A Response object which allows us to set headers
    dict[str, Any], # A dict, to return JSON
    Tuple[dict[str, Any], int], # A tuple with a dict (above) and a status code
]

def _request_has_connection() -> bool:
  """ Check if a db connection is stored in the global object. """
  return hasattr(flask.g, 'dbconn')

def _get_request_conn():
  """ Get db connection from global object if it exists, or create new one. """
  if not _request_has_connection():
    flask.g.dbconn = db.Db(app.config['DB_FILE'])

  return flask.g.dbconn

@app.teardown_request
def _close_db_connection(_): # pyright: reportUnusedFunction=false
  """ Close the db connection on Flask teardown, if it's been created. """
  if _request_has_connection():
    flask.g.dbconn.close()


class ImageIdConverter(werkzeug.routing.BaseConverter):
  """ Routing converter for image_id strings as path parameters. """
  # Besides doing a bit of validation, the important feature is it will "reject"
  # a path if the paramter doesn't validate, which is useful since the image_id
  # is otherwise a universal-looking path
  def to_python(self, value: str) -> Any:
    if re.fullmatch(r'[a-z2-7]{13}', value):
      return value

    raise werkzeug.routing.ValidationError()

  def to_url(self, value: Any) -> str:
    return super().to_url(value)

app.url_map.converters['imageid'] = ImageIdConverter


@app.cli.command('initdb') # pyright: reportUnknownMemberType=false
def initdb():
  """ CLI command to load the schema. """
  schema_file = MY_DIR / 'schema.sql'
  _get_request_conn().load_schema(schema_file)
  print('Loaded database schema from', schema_file)

##### Flask Routes
# SPA HTML
@app.route('/')
@app.route('/<imageid:image_id>')
@oidc.require_login
def spa(image_id: Optional[str] = None) -> FlaskResponse: # pylint: disable=unused-argument
  """ Return the index.html for the single page app. """
  return flask.render_template('index.html',
                               user_id=cast(str, oidc.user_getfield('email')))

# Raw Image
@app.route('/i/<image_id>.png')
@oidc.require_login # The actual username is irrelevant if they're logged in.
def get_image_data(image_id: str) -> FlaskResponse:
  """ Returns a screenshot image from the filesystem. """
  img = _get_request_conn().get_image(image_id)

  if not img:
    return "Screenshot Not Found", 404

  return flask.send_file(STORAGE.read_file(img.image_id), mimetype='image/png')

#### API Calls
# Image GET
@app.route('/api/v1/images/<image_id>', methods=['GET'])
@oidc.require_login # The actual username is irrelevant if they're logged in.
def get_image(image_id: str) -> FlaskResponse:
  """ Return a JSON-able image from an image_id. """
  img = _get_request_conn().get_image(image_id)
  if not img:
    return {}, 404

  return img.as_dict()

# Image POST
@app.route('/api/v1/images/', methods=['POST'])
@oidc.require_login
def new_image() -> FlaskResponse:
  """ Create a new screenshot object from a posted image file """
  img_file = flask.request.files['img']
  img = models.Image(user_id=cast(str, oidc.user_getfield('email')),
                     source_url=flask.request.form.get('source_url'))
  _get_request_conn().insert_image(img)

  STORAGE.write_file(img.image_id, img_file)

  return img.as_dict()

# Image PUT
@app.route('/api/v1/images/<image_id>', methods=['PUT'])
@oidc.require_login
def update_image(image_id: str) -> FlaskResponse:
  """ Update image in datastore from JSON. """
  # We don't accept image uploads, though we'll have to at some point
  image = models.Image(**cast(dict[str, Any], flask.request.get_json()))
  assert image_id == image.image_id
  # The DB class only updates the record if the user_id matches with what is in
  # the database. This will silently fail otherwise.
  _get_request_conn().update_image(image,
                                   cast(str, oidc.user_getfield('email')))
  return "Success", 200
