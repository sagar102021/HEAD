'use strict'

const fs = require('fs');

function isObject(type) {
    return type[0] === '{';
}
function isArray(type) {
    return type[0] === '[';
}
function isNumber(type) {
    return type === "Number";
}
function isString(type) {
    return type === "String";
}
function isBoolean(type) {
    return type === "Boolean";
}

function splitCommas(line) {
    let len = line.length;
    let csvs = [], csv = '', f = 0,c = 0;
    for(let i = 0; i < len; i++) {
        if(line[i] === '[') {
            c ++;
            while(c !== 0) {
                csv += line[i];
                i++;
                if(line[i] === ']') {
                    c--;
                }
                else if(line[i] === '[') {
                    c++;
                }
            }
            csv += ']';
        }
        else if(line[i] === '{') {
            f++;
            while(f !== 0) {
                csv += line[i];
                i++;
                if( line[i] === '}') {
                    f--;
                }else if(line[i] === '{') {
                    f++;
                }
            }
            csv += '}';
        }
        else if(line[i] === ',') {
            csvs.push(csv);
            csv = '';
        }
        else {
            csv += line[i];
        }
    }
    if(csv !== '') {
        csvs.push(csv);
    }
    return csvs;
}

function splitColun(csv) {
    let key = '', value = '', i = 0;
    while(csv[i] !== ':') {
        key += csv[i];
        i++;
    }
    i++;
    while(i < csv.length) {
        value += csv[i];
        i++;
    }
    return [key, value];
}


function parseSchema(variable, type) {
    if (isObject(type)) {
        let child = [];
        splitCommas(type.replace(/^\{/g, '').replace(/\}$/g, '')).forEach((csv) => {
            let csvkeyValue = splitColun(csv);
            let sChild = parseSchema(csvkeyValue[0], csvkeyValue[1]);
            child.push(sChild);
        })
        return {
                id: variable,
                type: "Object",
                child: child
        }
    }
    else if (isArray(type)) {
        let child = parseSchema("element", type.replace(/[\[\]]/g, ''));
        return {
            id: variable,
            type: "Array",
            child: child
        }
    }
    else if (isNumber(type)) {
        return {
            id: variable,
            type: "Number",
            child: null
        }
    }
    else if(isString(type)) {
        return {
            id: variable,
            type: "String",
            child: null
        }
    }
    else if(isBoolean(type)) {
        return {
            id: variable,
            type: "Boolean",
            child: null
        
        }
    }
}

function parseData(value, schema) {
    if(schema.type === "Object") {
        let child = {};
        splitCommas(value.replace(/^\{/g, '').replace(/\}$/g, '')).forEach((v, i) => {
            let t = parseData(v, schema.child[i]);
            child = {...child, ...t};
        });
        return {
            [schema.id]: child
        };
    } else if(schema.type === "Array") {
        let child = [];
        splitCommas(value.replace(/^\[/g, '').replace(/\]$/g, '')).forEach((v) => {
            let t = parseData(v, schema.child);
            child.push(t.element);
        })
        return {
            [schema.id]: child
        }
    } else if(schema.type === "Number") {
        return {
            [schema.id]: value
        }
    } else if(schema.type === "String") {
        return {
            [schema.id]: value
        }
    } else if(schema.type === "Boolean") {
        return {
            [schema.id]: value 
        }
    }
}


/////////----------------------TESTS
/* fs.readFile('sample.tson', (err, data) => {
    let lines = data.toString().split('\n');
}) */

function sandwitch(string) {
    return '{' + string + '}'
}

let  p = `{1, leane grapham, bret, sincere@april.biz, {kulas Light, Apt. 556, gwenborough, 9213-123, {-37.3159, 81.1496}, 1-70-736, hildegard.org}, {Romaguera-crona, adhkajd, akdhad}}`.replace(/\s/g, '');
let  schma = `{Id:Number, name: String, username: String, email: String, address: {street: String, suite: String, city: String, zipcode: Number, geo: {lat: String, lng: String}, phone: String, website: String}, company: {name: String, catchPhrase: String, bs: String}}`.replace(/\s/g, '');

console.log(schma);

let sch = parseSchema("root" ,schma);
console.log(JSON.stringify(schma));
console.log(JSON.stringify(parseData(p, sch), null, 2));
//console.log(JSON.stringify(parseSchema("root", "{name:String,age:Number,friends:[String],studies:{class:String,year:Number}}"), null, 2));