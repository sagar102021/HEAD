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
        splitCommas(type.replace(/^\{/g, '').replace(/,\}$/g, '')).forEach((csv) => {
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
        let child = parseSchema("element", type.replace(/^\[/g, '').replace(/,\]$/g, ''));
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


function makeSchema(jsonObject) {
    let schema = [];
    Object.keys(jsonObject).forEach(key => {
        if(typeof jsonObject[key] === 'number') {
            schema.push({
                id: key,
                type: "Number",
                child: null
            });
        }   
        else if(typeof jsonObject[key] === 'string') {
            schema.push({
                id: key,
                type: "String",
                child: null
            });
        } 
        else if(typeof jsonObject[key] === 'boolean') {
            schema.push({
                id: key,
                type: "Boolean",
                child: null
            });
        }
        else if(typeof jsonObject[key] === 'object') {
            if(Array.isArray(jsonObject[key])) {
                let child = [];
                let arrayElement = {"Element": jsonObject[key][0]}
                child = [...child, ...makeSchema(arrayElement)];
                schema.push({
                    id: key,
                    type: "Array",
                    child: child
                });
            }
            else {
                let child = [];
                child = [...child, ...makeSchema(jsonObject[key])];
                schema.push({
                    id: key,
                    type: "Object",
                    child: child
                });
            }
        }
    });
    return schema;
}

function serializeSchema(schema) {
    let serializedSchema = '';
    schema.forEach(key => {
        if(key.type == "Number") {
            serializedSchema += key["id"] + ":" + key['type'] + ",";
        } else if(key.type === "String"){
            serializedSchema += key["id"] + ":" + key['type'] + ",";
        } else if(key.type === "Boolean") {
            serializedSchema += key["id"] + ":" + key['type'] + ",";
        } else if(key.type === "Array") {
            let innerSchema = serializeSchema(key["child"]);
            innerSchema = innerSchema.replace("Element:", "");
            serializedSchema += key["id"] + ":[" + innerSchema + "],";
        } else if(key.type === "Object") {
            let innerSchema = serializeSchema(key["child"]);
            serializedSchema += key["id"] + ':{' + innerSchema + '},';
        }
    });
    return serializedSchema;
}

function serializeData(dataObject, schemaObject) {
    let serializedData = '';
    schemaObject.forEach(key => {
        if(key.type === "Number") {
            serializedData += String(dataObject[key["id"]]) +  ","; 
        }
        else if(key.type === "String") {
            serializedData += dataObject[key["id"]] + ",";
        }
        else if(key.type === "Boolean") {
            serializedData += dataObject[key["id"]] + ",";
        }
        else if(key.type === "Array") {
            serializedData += '[';
            let innerData = '';
            (dataObject[key["id"]])?dataObject[key["id"]].forEach((arrayElement) => {
                let isAOO = key["child"][0]["type"] === "Object";
                if(isAOO) {
                    innerData += '{';
                }
                innerData += serializeData(arrayElement, key["child"][0]["child"]);
                if(isAOO) {
                    innerData += '}';
                }
            }):(innerData = '');
            serializedData += innerData;
            serializedData += '],';
        }
        else if(key.type === "Object") {
            serializedData += '{';
            let innerData = "";
            innerData += (dataObject[key["id"]]) ? serializeData(dataObject[key["id"]], key["child"]) : "";
            serializedData += innerData;
            serializedData += '},';
        }
    });
    return serializedData;
}

function sandwitch(string) {
    return '{' + string + '}'
}


function serialize(jsonArray) {
    let schemaObj = makeSchema(jsonArray[0]);
    let serializedSchema = serializeSchema(schemaObj);
    let serializedData = "";
    jsonArray.forEach(obj => {
        let serializedObj = serializeData(obj, schemaObj);
        serializedData += serializedObj + "\n";
    });
    return serializedSchema + "\n" + serializedData;
}

function deserialize(headString) {
    let heads = headString.split("\n");
    let schemaObj = parseSchema("root", sandwitch(heads[0]));
    let parsedJson = [];
    for(let i = 1; i < heads.length; i++) {
        if(heads[i] != "") {
            let jsonObject = parseData(heads[i], schemaObj);
            parsedJson.push(jsonObject);
        }
    }
    return parsedJson.map(obj => obj.root);
}

///////TEST -----------------------

let d = JSON.parse(fs.readFileSync("sample.json"));

fs.writeFileSync("serialized.head", serialize(d));

fs.readFile("serialized.head", null, (err, data) => {
    fs.writeFileSync("deserialize.json", JSON.stringify(deserialize(data.toString(), null, 2)));
})

