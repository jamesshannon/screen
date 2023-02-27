""" StorageService for reading/writing images in GCS buckets. """
# pyright: reportImportCycles=false, reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
import io
from typing import Optional

from google.cloud import storage as gstore
from google.oauth2 import service_account
from werkzeug import datastructures

from screen_server.storage import storage

class GcsStorageService(storage.StorageService):
  """ StorageService for reading/writing images in GCS. """
  def __init__(self, config: dict[str, str],
               local_cache: Optional[storage.StorageService]):
    """ Create GCS session. """
    super().__init__(config, local_cache)

    creds = service_account.Credentials.from_service_account_file(
        config['STORAGE_GCS_SAKE'])

    client = gstore.Client(credentials=creds)
    self.bucket = client.bucket(config['STORAGE_GCS_BUCKET'])

  def write_file(self, file_id: str, fdata: datastructures.FileStorage,
      variant: Optional[str] = None) -> None:
    """Put image in GCS bucket and possibly save a cache locally. """
    blob = self.bucket.blob(self._get_filename(file_id, variant))
    blob.upload_from_file(fdata)

    # If local_cache is defined then also save to filesystem
    self._maybe_cache_locally(file_id, fdata, variant)

  def read_file(self, file_id: str, variant: Optional[str] = None) -> io.IOBase:
    """ Read file from possible local cache and GCS bucket. """
    # If local cache has been set up then try to read file from there first
    if self.local_cache:
      try:
        return self.local_cache.read_file(file_id, variant)
      except FileNotFoundError:
        pass

    # File not available locally -- get from GCS
    fdata = io.BytesIO()
    blob = self.bucket.blob(self._get_filename(file_id, variant))
    fdata.write(blob.download_as_bytes())
    fdata.seek(0)
    #name = self._get_filename(file_id, variant)

    #self.bucket.download_fileobj(name, fdata)

    self._maybe_cache_locally(file_id, fdata, variant)

    return fdata
