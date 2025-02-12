import util from 'util';

export function dump(obj: any) {
    console.log(util.inspect(obj, { depth: null, colors: true }));
}
