// ======================= part 1 ======================= 

function dataProcessor(aoe_path, aoe_result_path) {
    let aoe = require(`${aoe_path}`);
    let aoe_result = require(`${aoe_result_path}`);

    if(aoe === undefined) {
        alert('File does not exist: ' + aoe_path);
    }
    if(aoe_result_path === undefined) {
        alert('File does not exist: ' + aoe_result_path);
    }

    let nodes = aoe.graph.nodes;
    let edges = aoe.graph.edges;

    let action_result = aoe_result.action_result;
    let event_result = aoe_result.event_result;

    let id2nodes = new Array(nodes.length);
    let id2event = new Array(nodes.length);

    nodes.forEach((item, index) => {
        id2nodes[item.id-1] = index;
    });

    event_result.forEach((item, index) => {
        id2event[item[0]-1] = index;
    });

    let id2edges = new Array();
    let id2action = new Array();
    for (var k = 0; k < edges.length; k++) {
        id2edges[k] = new Array(edges.length);
        id2action[k] = new Array(edges.length);
    }
    edges.forEach((item, index) => {
        id2edges[item[0]][item[1]] = index;
        id2edges[item[1]][item[0]] = index;
    });
    action_result.forEach((item, index) => {
        id2action[item[0]-1][item[1]-1] = index;
        id2action[item[1]-1][item[0]-1] = index;
    });

    return {
        nodes: nodes,
        edges: edges,
        id2nodes: id2nodes,
        id2event: id2event,
        event_result: event_result,
        id2edges: id2edges,
        id2action: id2action,
        action_result: action_result
    }
}

// ======================= part 2 ======================= 

function stamp2date(timestamp) {
    let date = new Date(timestamp);
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
    let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    let s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return Y + M + D + h + m + s;
}

function strTimes(str, num) {
    return new Array(num+1).join(str);
}



export {dataProcessor, stamp2date, strTimes};