""" SQLite3 database access for persistence of the Image model. """
import sqlite3
import json
import time
import pathlib
from typing import List, Optional

from screen_server import models

class Db():
  """ SQLite data access class. """
  def __init__(self, db_path: str):
    """ Open the SQLite connection and set defaults. """
    self.conn = sqlite3.connect(db_path, isolation_level=None)
    self.conn.execute('pragma journal_mode=wal;')
    self.conn.row_factory = models.Image.sqlite3_factory

  def load_schema(self, schema_file: pathlib.Path):
    """ Load schema into the database from the schema_file. """
    self.conn.executescript(open(schema_file, 'r', encoding='ascii').read())

  def close(self):
    """ Close the SQLite connection. """
    self.conn.close()

  def insert_image(self, image: models.Image) -> None:
    """ Insert an Image into the database. """
    sql = ('INSERT INTO images (image_id, source_url, user_id, '
                                'created, updated) '
           'VALUES(?, ?, ?, ?, ?)')

    image.created = int(time.time())
    image.updated = int(time.time())

    self.conn.execute(sql, (image.image_id, image.source_url,
                            image.user_id, image.created, image.updated))


  def get_image(self, image_id: str) -> Optional[models.Image]:
    """ Get Image record from the database and return an Image instance. """
    sql = 'SELECT * FROM images WHERE image_id = ?'
    cur = self.conn.execute(sql, (image_id, ))
    return cur.fetchone()

  def get_images_by_user(self, user_id: str, limit: int = 20) -> List[str]:
    """ Get most recent Image instances for a user. """
    sql = f'SELECT * FROM images WHERE user_id = ? LIMIT {int(limit)}'
    cur = self.conn.execute(sql, (user_id, ))
    return cur.fetchall()

  def update_image(self, image: models.Image, user_name: str) -> int:
    """ Update image row based on Image instance. """
    sql = ('UPDATE images '
           'SET annotations = ?, '
           'updated = ? '
           'WHERE image_id = ? '
           '  AND user_id = ?')
    cur: sqlite3.Cursor = self.conn.execute(
        sql, (json.dumps(image.annotations), int(time.time()),
              image.image_id, user_name))

    return cur.rowcount
