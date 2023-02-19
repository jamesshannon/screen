""" StorageService for reading/writing images in local filesystem. """
# pyright: reportImportCycles=false
import io
import pathlib
from typing import Optional, Union

from werkzeug import datastructures

from screen_server.storage import storage

class LocalFileSystemStorageService(storage.StorageService):
  """ Storage within the local filesystem. """
  # TODO: Make this multi-processor safe using something like fasteners.
  # Currently it's possible that two processes (or threads) might try to write
  # to the file at the same time, or read from the file while it's being
  # written to. This is far more likely when this class is used as a local
  # cache for a cloud-based service. E.g., two requests for the same image are
  # made, both of which find no local cache, download the image, and then begin
  # writing at about the same time. Or one that reads while the image is being
  # written. These race conditions are highly unlikely, but should be
  # considered.
  def __init__(self, config: dict[str, str]):
    super().__init__(config)

    self.root_directory = pathlib.Path(config['FILES_LOCAL_DIR'])
    self.root_directory.mkdir(exist_ok=True)

  def _get_filepath(self, file_id: str,
                    variant: Optional[str] = None) -> pathlib.Path:
    # Need to shard files across directories. File names are 13 characters. The
    # first half are randomly generated while the last half is a timestamp which
    # effectively means that first half of that is going to represent the
    # "years" while the last half will be somewhat well distributed over time.
    # Filenames are base32, so 1024 possibilities per 2 characters.
    sharded_dir = self.root_directory / file_id[-6:-4] / file_id[0]
    sharded_dir.mkdir(exist_ok=True, parents=True)
    return sharded_dir / self._get_filename(file_id, variant)

  def write_file(self, file_id: str,
      fdata: Union[datastructures.FileStorage, io.BytesIO],
      variant: Optional[str] = None) -> None:
    name = self._get_filepath(file_id, variant)

    # Werkzeug FileStorage can only (easily) be saved with .save()
    if isinstance(fdata, datastructures.FileStorage):
      fdata.save(name) # pyright: reportUnknownMemberType=false
    else:
      with open(name, 'wb') as fobj:
        fobj.write(fdata.getbuffer())

  def read_file(self, file_id: str,
      variant: Optional[str] = None) -> io.IOBase:
    return open(self._get_filepath(file_id, variant), 'rb')
