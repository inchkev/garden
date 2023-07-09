from parse import *
from collections import defaultdict
import json
import plistlib
import sys

if __name__ == '__main__':
    if len(sys.argv) == 2:
        filename = sys.argv[1]
    elif len(sys.argv) == 1:
        print(f'File unspecified. Use python3 {sys.argv[0]} <.DS_Store file>'
              ' to specify file. Defaulting to .DS_Store in the current'
              ' directory...', file=sys.stderr)
        filename = '.DS_Store'
    else:
        print(f'Usage: python3 {sys.argv[0]} <.DS_Store file>')
    if len(sys.argv) < 2:
        sys.exit("Usage: python main.py <DS_STORE FILE>")

    with open(filename, 'rb') as file:
        content = file.read()

    parsed = defaultdict(dict)
    ds_store = DSStore(content)
    for record in ds_store.read():
        name = record.name
        for field, data in record.fields.items():

            if field == 'Iloc':
                # record.validate_type(field, data, bytes, 16)
                if not isinstance(data, bytes) or len(data) != 16:
                    continue
                x = int.from_bytes(data[0:4], 'big', signed=False)
                y = int.from_bytes(data[4:8], 'big', signed=False)
                parsed[name]['Iloc'] = {'x': x, 'y': y}

            elif field == 'icvp':
                # self.validate_type(field, data, bytes)
                # yield 'Icon view property list:'
                # yield from show(plistlib.loads(data), tab_depth=1)
                if not isinstance(data, bytes):
                    continue
                parsed[name]['icvp'] = dict()
                parsed[name]['icvp']['arrangeBy'] = plistlib.loads(data)['arrangeBy']
                parsed[name]['icvp']['iconSize'] = plistlib.loads(data)['iconSize']

                # type = 0 : Default, 1: Color, 2: Image
                parsed[name]['icvp']['bgType'] = plistlib.loads(data)['backgroundType']
                if parsed[name]['icvp']['bgType'] == 1:
                    parsed[name]['icvp']['bgR'] = int(plistlib.loads(data)['backgroundColorRed'] * 255)
                    parsed[name]['icvp']['bgG'] = int(plistlib.loads(data)['backgroundColorGreen'] * 255)
                    parsed[name]['icvp']['bgB'] = int(plistlib.loads(data)['backgroundColorBlue'] * 255)

    sys.stdout.write(json.dumps(parsed))
    sys.stdout.flush()
