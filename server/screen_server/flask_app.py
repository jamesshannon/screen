""" Module to help setup the Flask app """
import pathlib
import re
from typing import Any, Tuple, Union

import flask
import flask_oidc
import dotenv
import werkzeug.routing

# pyright: reportUnknownMemberType=false

def get_app(app_dir: pathlib.Path) -> flask.Flask:
  """ Get a pre-configured flask app instance. """
  # The python package has its own root but static and template folders are at
  # the same level as this script
  app = flask.Flask(__name__, root_path=str(app_dir / 'screen_server'),
                    static_folder=str(app_dir / 'static'),
                    template_folder=str(app_dir / 'templates'))

  # Load config values from optional dotenv files.
  # Config file, and values, are relative to the app root directory
  dotenv.load_dotenv(dotenv_path=app_dir / 'config' / 'config.env',
                     override=True)
  if app.config['DEBUG']:
    dotenv.load_dotenv(dotenv_path=app_dir / 'config' / 'config_debug.env',
                       override=True)

  app.config.from_prefixed_env()
  app.url_map.converters['imageid'] = ImageIdConverter
  app.logger.setLevel('DEBUG' if app.config['DEBUG'] else 'INFO')

  return app

def get_oidc(app: flask.Flask) -> flask_oidc.OpenIDConnect:
  """ Get an OIDC instance configured configured with the Flask app. """
  return flask_oidc.OpenIDConnect(app)


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

# Type definition for view function return values; they can return a handful of
# things and Flask will interpret it correctly
ResponseType = Union[
    str, # string, such as page content or a short message
    Tuple[str, int], # Tuple with string (above) plus a status code
    flask.Response, # A Response object which allows us to set headers
    dict[str, Any], # A dict, to return JSON
    Tuple[dict[str, Any], int], # A tuple with a dict (above) and a status code
]
""" Flask view function return value type definition. """
