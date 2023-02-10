""" Image model. """
import dataclasses
import json
import sqlite3
import time
from typing import Any, Optional, Tuple, Union

from screen_server import utils

def _timeint():
  """ Return the int portion (ie, seconds) of time.time(). """
  return int(time.time())

Annotation = Tuple[str, dict[str, Union[str, Any]]]
""" JSON-able representation of an Annotation. """

@dataclasses.dataclass
class Image():
  """ Image class. """
  image_id: str = dataclasses.field(default_factory=utils.make_id)
  source_url: Optional[str] = None
  user_id: str = ''
  metadata: str = ''
  annotations: list[Annotation] = dataclasses.field(default_factory=list)
  status: str = 'PUBLIC'
  created: int = dataclasses.field(default_factory=_timeint)
  updated: int = dataclasses.field(default_factory=_timeint)

  @classmethod
  def sqlite3_factory(cls, cursor: sqlite3.Cursor, row: tuple[str]) -> 'Image':
    """ Factory method for SQLite to produce an Image instance. """
    custom_fields = ['annotations']

    fields = [column[0] for column in cursor.description]
    row_dict = dict(list(zip(fields, row)))

    ss = cls(**{key: value for key, value in row_dict.items()
                  if key not in custom_fields and value is not None})

    if row_dict.get('annotations'):
      ss.annotations = json.loads(row_dict['annotations'])

    return ss

  def as_dict(self) -> dict[str, Any]:
    """ Return Image as dict, for JSON purposes. """
    return dataclasses.asdict(self)

