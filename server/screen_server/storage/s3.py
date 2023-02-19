""" StorageService for reading/writing images in S3 buckets. """
# pyright: reportImportCycles=false
import io
from typing import Optional, TYPE_CHECKING

import boto3
from werkzeug import datastructures

from screen_server.storage import storage

if TYPE_CHECKING:
  from screen_server.storage import local

class S3FileSystemStorageService(storage.StorageService):
  """ StorageService for reading/writing images in local filesystem. """
  def __init__(self, config: dict[str, str],
               local_cache: Optional['local.LocalFileSystemStorageService']):
    """ Create s3 session. """
    super().__init__(config)

    self.local_cache = local_cache

    session = boto3.Session(
      aws_access_key_id=config['FILES_S3_KEY'],
      aws_secret_access_key=config['FILES_S3_SECRET']
    )
    resource = session.resource('s3')
    self.bucket = resource.Bucket(config['FILES_S3_BUCKET'])

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

  def write_file(self, file_id: str, fdata: datastructures.FileStorage,
      variant: Optional[str] = None) -> None:
    """Put image in s3 bucket and possibly save a cache locally. """
    self.bucket.upload_fileobj(fdata, self._get_filename(file_id, variant))

    # If local_cache is defined then also save to filesystem
    self._maybe_cache_locally(file_id, fdata, variant)

  def read_file(self, file_id: str, variant: Optional[str] = None) -> io.IOBase:
    """ Read file from possible local cache and S3 bucket. """
    # If local cache has been set up then try to read file from there first
    if self.local_cache:
      try:
        return self.local_cache.read_file(file_id, variant)
      except FileNotFoundError:
        pass

    # File not available locally -- get from s3
    name = self._get_filename(file_id, variant)
    fdata = io.BytesIO()
    self.bucket.download_fileobj(name, fdata)

    self._maybe_cache_locally(file_id, fdata, variant)

    fdata.seek(0)
    return fdata
