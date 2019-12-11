const zlib = require('zlib');
const { stdin, stdout } = process;
const transforms = { zip: zlib.createGzip(), unzip: zlib.createGunzip() };
const usage = `node pass.js [ ${Object.keys(transforms).join(' | ')} ] < from_file > to_file`;
const main = () => {
    const [, , name] = process.argv;
    const transform = transforms[name];
    if (transform) stdin.pipe(transform).pipe(stdout);
    else console.error(usage);
}
main();
