""" StorageService factory providing filesystem access to store images. """
from __future__ import annotations
import abc
import io
import logging
from typing import Optional

from werkzeug import datastructures

LOGGER = logging.getLogger(__name__)

class StorageService(abc.ABC):
  """ Abstract class representing a storage service to store image files. """
  def __init__(self, config: dict[str, str]):
    pass

  @classmethod
  def _get_filename(cls, file_id: str, variant: Optional[str] = None) -> str:
    """ Generate a filename from the ID and the variant. """
    variant = f'_{variant}' if variant else ''
    return f'{file_id}{variant}.png'

  @abc.abstractmethod
  def write_file(self, file_id: str, fdata: datastructures.FileStorage,
      variant: Optional[str]=None) -> None:
    """ Save the file-like object to storage. """
    # Should overwrite the file if it already exists

  @abc.abstractmethod
  def read_file(self, file_id: str,
      variant: Optional[str] = None) -> io.IOBase:
    """ Read file from storage. """

  @classmethod
  def get_instance(cls, config: dict[str, str]) -> StorageService:
    """ Get appropriate instance of StorageService based on config settings. """
    # pylint: disable=import-outside-toplevel
    from screen_server.storage import local
    from screen_server.storage import s3

    if config['STORAGE_SERVICE'] == 'LOCAL':
      LOGGER.info('Creating local filesystem service')
      return local.LocalFileSystemStorageService(config)

    if config['STORAGE_SERVICE'] == 'S3':
      local_cache = None

      if config.get('STORAGE_S3_LOCAL_CACHE'):
        LOGGER.info('Creating local filesystem service for caching')
        local_cache = local.LocalFileSystemStorageService(config)

      LOGGER.info('Creating s3 filesystem service')
      return s3.S3FileSystemStorageService(config, local_cache)

    raise ValueError((f'{config["STORAGE_SERVICE"]} storage service is not '
                      'available'))
