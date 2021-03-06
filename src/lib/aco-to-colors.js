import { UI } from 'sketch';
import { Buffer } from 'buffer';
import { readFileSync } from '@skpm/fs';
import color from './color';

/**
 * Convert Adobe color swatch (ACO) file to Array [{name, color}]
 * File format specification:
 * https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/#50577411_pgfId-1055819
 * http://www.nomodes.com/aco.html
 * @param  {String} filePath
 * @returns {Array} [ {name, color} ]
 */
export default function(filePath) {

    let colorContents = readFileSync(filePath);
    let colorBuffer = Buffer.from(colorContents);

    if (colorBuffer.length < 4) {
        UI.message('Error: Not a Adobe color swatch (ACO) file.');
        return;
    }

    let version = colorBuffer.slice(0, 2).readUInt16BE(0);
    let count = colorBuffer.slice(2, 4).readUInt16BE(0);

    let colors = [];

    // version 1
    let i;
    if (version === 1 && (colorBuffer.length - 4) / 10 === count) {
        i = 4;
        while (i < colorBuffer.length) {
            let colorSpace = colorBuffer.slice(i, i + 2).readUInt16BE(0);
            let w = colorBuffer.slice(i + 2, i + 4).readUInt16BE(0);
            let x = colorBuffer.slice(i + 4, i + 6).readUInt16BE(0);
            let y = colorBuffer.slice(i + 6, i + 8).readUInt16BE(0);
            let z = colorBuffer.slice(i + 8, i + 10).readUInt16BE(0);
            let nscolor = color.colorFromAco(colorSpace, w, x, y, z);
            let hexValue = color.toHexValue(nscolor);
            colors.push({
                name: null,
                color: hexValue
            });
            i += 10;
        }
    }

    // version 2
    if (
        (version === 2) ||
        (
            version === 1 &&
            colorBuffer.length > count * 10 + 8 &&
            colorBuffer.slice(4 + count * 10, 6 + count * 10).readUInt16BE(0) === 2 &&
            colorBuffer.slice(6 + count * 10, 8 + count * 10).readUInt16BE(0) === count
        )
    ) {
        i = 4 + count * 10 + 4;
        if (version === 2) {
            i = 4;
        }
        while (i < colorBuffer.length) {
            let colorSpace = colorBuffer.slice(i, i + 2).readUInt16BE(0);
            let w = colorBuffer.slice(i + 2, i + 4).readUInt16BE(0);
            let x = colorBuffer.slice(i + 4, i + 6).readUInt16BE(0);
            let y = colorBuffer.slice(i + 6, i + 8).readUInt16BE(0);
            let z = colorBuffer.slice(i + 8, i + 10).readUInt16BE(0);
            let colorName = '';
            let nameLength = colorBuffer.slice(i + 12, i + 14).readUInt16BE(0);
            for (let j = 0; j < nameLength * 2 - 2; j += 2) {
                colorName += String.fromCodePoint(colorBuffer.slice(i + 14 + j, i + 16 + j).readUInt16BE(0));
            }
            let nscolor = color.colorFromAco(colorSpace, w, x, y, z);
            let hexValue = color.toHexValue(nscolor);
            colors.push({
                name: colorName,
                color: hexValue
            });
            i += 14 + nameLength * 2;
        }
    }

    return colors;
}