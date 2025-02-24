// @ts-nocheck
/* eslint-disable */

const re = {
  not_string: /[^s]/,
  not_bool: /[^t]/,
  not_type: /[^T]/,
  not_primitive: /[^v]/,
  number: /[diefg]/,
  numeric_arg: /[bcdiefguxX]/,
  json: /[j]/,
  not_json: /[^j]/,
  text: /^[^\x25]+/,
  modulo: /^\x25{2}/,
  placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
  key: /^([a-z_][a-z_\d]*)/i,
  key_access: /^\.([a-z_][a-z_\d]*)/i,
  index_access: /^\[(\d+)\]/,
  sign: /^[+-]/,
};

function sprintfFormat(parseTree, argv) {
  let cursor = 1;
  const treeLength = parseTree.length;
  let arg;
  let output = '';
  let i;
  let k;
  let ph;
  let pad;
  let padCharacter;
  let padLength;
  let isPositive;
  let sign;

  for (i = 0; i < treeLength; i += 1) {
    if (typeof parseTree[i] === 'string') {
      output += parseTree[i];
    } else if (typeof parseTree[i] === 'object') {
      ph = parseTree[i]; // convenience purposes only
      if (ph.keys) { // keyword argument
        arg = argv[cursor];
        for (k = 0; k < ph.keys.length; k += 1) {
          if (arg === undefined) {
            throw new Error(`[sprintf] Cannot access property "${ph.keys[k]}" of undefined value "${ph.keys[k - 1]}"`);
          }
          arg = arg[ph.keys[k]];
        }
      } else if (ph.param_no) { // positional argument (explicit)
        arg = argv[ph.param_no];
      } else { // positional argument (implicit)
        arg = argv[cursor];
        cursor += 1;
      }

      if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
        arg = arg();
      }

      if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && Number.isNaN(arg))) {
        throw new TypeError(`[sprintf] expecting number but found ${arg}`);
      }

      if (re.number.test(ph.type)) {
        isPositive = arg >= 0;
      }

      switch (ph.type) {
        case 'b':
          arg = parseInt(arg, 10).toString(2);
          break;
        case 'c':
          arg = String.fromCharCode(parseInt(arg, 10));
          break;
        case 'd':
        case 'i':
          arg = parseInt(arg, 10);
          break;
        case 'j':
          arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width, 10) : 0);
          break;
        case 'e':
          arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential();
          break;
        case 'f':
          arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg);
          break;
        case 'g':
          arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg);
          break;
        case 'o':
          arg = (parseInt(arg, 10) >>> 0).toString(8);
          break;
        case 's':
          arg = String(arg);
          arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
          break;
        case 't':
          arg = String(!!arg);
          arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
          break;
        case 'T':
          arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
          arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
          break;
        case 'u':
          arg = parseInt(arg, 10) >>> 0;
          break;
        case 'v':
          arg = arg.valueOf();
          arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
          break;
        case 'x':
          arg = (parseInt(arg, 10) >>> 0).toString(16);
          break;
        case 'X':
          arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase();
          break;
      }

      if (re.json.test(ph.type)) {
        output += arg;
      } else {
        if (re.number.test(ph.type) && (!isPositive || ph.sign)) {
          sign = isPositive ? '+' : '-';
          arg = arg.toString().replace(re.sign, '');
        } else {
          sign = '';
        }
        padCharacter = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' ';
        padLength = ph.width - (sign + arg).length;
        pad = ph.width ? (padLength > 0 ? padCharacter.repeat(padLength) : '') : '';
        output += ph.align ? sign + arg + pad : (padCharacter === '0' ? sign + pad + arg : pad + sign + arg);
      }
    }
  }
  return output;
}

const sprintfCache = Object.create(null);

function sprintfParse(fmt) {
  if (sprintfCache[fmt]) {
    return sprintfCache[fmt];
  }

  let _fmt = fmt; let match; const parseTree = []; let
    arg_names = 0;

  while (_fmt) {
    if ((match = re.text.exec(_fmt)) !== null) {
      parseTree.push(match[0]);
    } else if ((match = re.modulo.exec(_fmt)) !== null) {
      parseTree.push('%');
    } else if ((match = re.placeholder.exec(_fmt)) !== null) {
      if (match[2]) {
        arg_names |= 1;
        const field_list = []; let replacement_field = match[2]; let
          field_match = [];
        if ((field_match = re.key.exec(replacement_field)) !== null) {
          field_list.push(field_match[1]);
          while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
            } else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
            } else {
              throw new SyntaxError('[sprintf] failed to parse named argument key');
            }
          }
        } else {
          throw new SyntaxError('[sprintf] failed to parse named argument key');
        }
        match[2] = field_list;
      } else {
        arg_names |= 2;
      }
      if (arg_names === 3) {
        throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported');
      }

      parseTree.push(
        {
          placeholder: match[0],
          param_no: match[1],
          keys: match[2],
          sign: match[3],
          pad_char: match[4],
          align: match[5],
          width: match[6],
          precision: match[7],
          type: match[8],
        },
      );
    } else {
      throw new SyntaxError('[sprintf] unexpected placeholder');
    }
    _fmt = _fmt.substring(match[0].length);
  }

  sprintfCache[fmt] = parseTree;
  return parseTree;
}

export function sprintf(key) {
  // `arguments` is not an array, but should be fine for this call
  return sprintfFormat(sprintfParse(key), arguments);
}

export function vsprintf(fmt, argv) {
  return sprintf.apply(null, [fmt].concat(argv || []));
}
