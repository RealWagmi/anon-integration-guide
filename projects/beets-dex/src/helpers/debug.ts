import util from 'util';

export function dump(obj: any) {
    console.log(util.inspect(obj, { depth: null, colors: true }));
}

export function dumpWithLabel(label: string, obj: any) {
    console.log(label, util.inspect(obj, { depth: null, colors: true }));
}
