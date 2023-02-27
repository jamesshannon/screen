""" StorageService factory providing filesystem access to store images. """
from __future__ import annotations
import abc
import io
import logging
from typing import Optional

from werkzeug import datastructures

LOGGER = logging.getLogger(__name__)

def _get_local_cache(config: dict[str, str]) -> Optional['StorageService']:
  """ Return a LocalFileSystemStorageService if local cache is configured. """
  if config.get('STORAGE_CLOUD_LOCAL_CACHE'):
    # pylint: disable=import-outside-toplevel
    from screen_server.storage import local

    LOGGER.info('Creating local filesystem service for caching')
    return local.LocalFileSystemStorageService(config)

  return None

class StorageService(abc.ABC):
  """ Abstract class representing a storage service to store image files. """
  def __init__(self, _: dict[str, str],
               local_cache: Optional[StorageService] = None):
    self.local_cache = local_cache

  def _maybe_cache_locally(self, file_id: str,
                           fdata: datastructures.FileStorage,
                           variant: Optional[str] = None) -> None:
    """ Write image locally using a StorageService, if configured. """
    if self.local_cache:
      try:
        fdata.seek(0)
        self.local_cache.write_file(file_id, fdata, variant)
        fdata.seek(0)
      except FileExistsError:
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

    # Service = LOCAL
    if config['STORAGE_SERVICE'] == 'LOCAL':
      from screen_server.storage import local

      LOGGER.info('Creating local filesystem service')
      return local.LocalFileSystemStorageService(config)

    # Service = S3
    if config['STORAGE_SERVICE'] == 'S3':
      from screen_server.storage import s3

      LOGGER.info('Creating s3 filesystem service')
      return s3.S3StorageService(config, _get_local_cache(config))

    # Service = GCS
    if config['STORAGE_SERVICE'] == 'GCS':
      from screen_server.storage import gcs

      LOGGER.info('Creating GCS filesystem service')
      return gcs.GcsStorageService(config, _get_local_cache(config))

    # Service is not available
    raise ValueError((f'{config["STORAGE_SERVICE"]} storage service is not '
                      'available'))
