import { MemoryBlockStore } from 'ipfs-car/blockstore/memory';
import { packToBlob } from 'ipfs-car/pack/blob';

const carCompressor = async (files: File[]) => {
  const formattedFiles = files.map((file) => ({
    path: encodeURIComponent(file.name),
    content: file,
  }));
  const { car } = await packToBlob({
    input: formattedFiles,
    blockstore: new MemoryBlockStore(),
    wrapWithDirectory: true,
  });

  return car;
};

export default carCompressor;