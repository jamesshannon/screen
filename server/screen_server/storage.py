""" Classes providing filesystem access to store Image images. """
import abc
import io
import pathlib
from typing import Optional
from werkzeug import datastructures

class StorageService(abc.ABC):
  """ Abstract class representing a storage service to store image files. """
  def __init__(self, config: str):
    pass

  @classmethod
  def get_filename(cls, file_id: str, variant: Optional[str] = None) -> str:
    """ Generate a filename from the ID and the variant. """
    variant = f'_{variant}' if variant else ''
    return f'{file_id}{variant}.png'

  @abc.abstractmethod
  def write_file(self, file_id: str, file: datastructures.FileStorage,
      variant: Optional[str]=None) -> None:
    """ Save the file-like object to storage. """
    # Should overwrite if it already exists

  @abc.abstractmethod
  def read_file(self, file_id: str,
      variant: Optional[str] = None) -> io.BufferedReader:
    """ Read file from storage. """

class LocalFileSystemStorageService(StorageService):
  """ Storage within the local filesystem. """
  def __init__(self, config: str):
    super().__init__(config)

    self.root_directory = pathlib.Path(config)
    self.root_directory.mkdir(exist_ok=True)

  def _get_filepath(self, file_id: str,
                    variant: Optional[str] = None) -> pathlib.Path:
    # Need to shard files across directories. File names are 13 characters. The
    # first half are randomly generated while the last half is a timestamp which
    # effectively means that first half of that is going to represent the
    # "years" while the last half will be somewhat well distributed over time.
    # Filenames are base32, so 1024 possibilities per 2 characters. The last
    # six characters basically the date without any of the randomness
    sharded_dir = self.root_directory / file_id[-6:-4] / file_id[0:2]
    sharded_dir.mkdir(exist_ok=True, parents=True)
    return sharded_dir / self.get_filename(file_id, variant)

  def write_file(self, file_id: str, file: datastructures.FileStorage,
      variant: Optional[str] = None) -> None:
    file.save(self._get_filepath(file_id, variant)) # pyright: reportUnknownMemberType=false

  def read_file(self, file_id: str,
      variant: Optional[str] = None) -> io.BufferedReader:
    print(self.get_filename(file_id, variant))
    return open(self._get_filepath(file_id, variant), 'rb')
