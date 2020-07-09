import { ByteNamePipe } from './byte-name.pipe';

describe('ByteNamePipe', () => {
  it('create an instance', () => {
    const pipe = new ByteNamePipe();
    expect(pipe).toBeTruthy();
  });
});
