import './App.css';
import React, { useState, useEffect} from 'react';
import * as utils from './utils';
import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';


function Graph(props) {
    let data = utils.dataProcessor(props.aoe_path, props.aoe_result_path);
    const [nodes, setNodes] = useState(data.nodes);
    const [edges, setEdges] = useState(data.edges);
    const [action_result, setActionResult] = useState(data.action_result);
    const [event_result, setEventResult] = useState(data.event_result);
    const id2edges = data.id2edges;
    const id2action = data.id2action;
    const id2event = data.id2event;
    let path_len_scale = 5;

    function renderDag() {
        let g = new dagreD3.graphlib.Graph({compound: true})
            .setGraph({nodesep: 65,
                ranksep: 50,
                marginx: 40,
                rankdir: 'LR',
                marginy: 40})
            .setDefaultEdgeLabel(function () { return {}; });
        
        // ========================== set nodes ==========================
        nodes.forEach((item, index) => {
            let nm = item.name;
            g.setNode(item.id-1, {
                label: item.id,
                name: nm,
                style:'fill: #d3d3d3',
                shape: 'circle',
                node_type: item.node_type,
                start_time: 'None',
                end_time: 'None',
                final_result: 'None',
            });       
        });


        event_result.forEach((item, index) => {
            let nm = nodes[item[0]-1].name;
            let st = utils.stamp2date(item[1].start_time);
            let et = utils.stamp2date(item[1].end_time);
            let nt = g.node(item[0]-1).node_type;

            if (item[1].final_result === 'Happen') {
                g.setNode(item[0]-1, {
                    label: item[0],
                    name: nm,
                    style: 'fill: #afa', 
                    shape: 'circle',
                    node_type: nt,
                    start_time: st,
                    end_time: et,
                    final_result: item[1].final_result,
                });           
            }
            else {
                g.setNode(item[0]-1, {
                    label: item[0],
                    name: nm, 
                    style: 'fill: #d3d3d3', 
                    shape: 'circle',
                    node_type: nt,
                    start_time: st,
                    end_time: et,
                    final_result: item[1].final_result,
                });
            }
        });

        // ========================== set edges ==========================
        edges.forEach((item, index) => {
            let ac = edges[id2edges[item[0]][item[1]]][2][1].action;
            let at = typeof ac === 'object' ? Object.keys(ac)[0] : ac;
            let space = utils.strTimes(' ', Math.round(item[2][1].name.length*path_len_scale));
            
            g.setEdge(item[0], item[1], {
                label: space,
                name: item[2][1].name,
                style: 'stroke: yellow; fill: none; stroke-width: 2px;',
                arrowheadClass: 'arrowhead_notrun',
                curve: d3.curveBasis,
                action_type: at,
                start_time: 'None',
                end_time: 'None',
                final_result: 'None',
            });
        });        
        
        action_result.forEach((item, index) => {
            let ac = edges[id2edges[item[0]-1][item[1]-1]][2][1].action;
            let at = typeof ac === 'object' ? Object.keys(ac)[0] : ac;
            let st = utils.stamp2date(item[2].start_time);
            let et = utils.stamp2date(item[2].end_time);
            let space = utils.strTimes(' ', Math.round(edges[id2edges[item[0]-1][item[1]-1]][2][1].name.length*path_len_scale));

            if (item[2].final_result === 'Success') {
                g.setEdge(item[0]-1, item[1]-1, {
                    label: space,
                    name: edges[id2edges[item[0]-1][item[1]-1]][2][1].name,
                    style: 'stroke: #afa; fill: none; stroke-width: 2px;',
                    arrowheadClass: 'arrowhead_success',
                    curve: d3.curveBasis,
                    action_type: at,
                    start_time: st,
                    end_time: et,
                    final_result: action_result[id2action[item[0]-1][item[1]-1]][2].final_result,
                });
            }
            else {
                g.setEdge(item[0]-1, item[1]-1, {
                    label: space,
                    name: edges[id2edges[item[0]-1][item[1]-1]][2][1].name,
                    style: 'stroke: red; fill: none; stroke-width: 2px;',
                    arrowheadClass: 'arrowhead_failed',
                    curve: d3.curveBasis,
                    action_type: at,
                    start_time: st,
                    end_time: et,
                    final_result: action_result[id2action[item[0]-1][item[1]-1]][2].final_result,
                });
            }

        });

        // Create the renderer
        let render = new dagreD3.render();
  
        // Set up an SVG group so that we can translate the final graph.
        let svg = d3.select("svg");
        let svgGroup = svg.append("g").attr('class', 'inner');
        
    

        let zoom = d3.zoom().on('zoom', function(e) {
            svgGroup.attr('transform', e.transform);      
        });
        svg.call(zoom);

        // Run the renderer. This is what draws the final graph.
        render(svgGroup, g);

        // ================= label beside node ==================
        let nd = svgGroup.append('g').attr('class', 'labels');       
        g.nodes().forEach( (v, i) => {
            let node = g.node(i);    
            nd.append('text')
            .attr('text-anchor', 'middle')
            .attr('id', node.label)
            .attr('x', node.x)
            .attr('y', -30 + node.y)
            .text(node.name);

            nd.append('g')
            .attr('id', 'node' + i)
            .attr('transform', 'translate('+node.x+' '+node.y+')')
            .append('path');
        });

        // ================= arc for node ==================
        let time_offset = 0;
        let arcGenerator = d3.arc().innerRadius(20).outerRadius(23).startAngle(0);
        let increase = true;
        let shallowp = d3.rgb(184,187,222), deepp = d3.rgb(128,0,128);
        let compute = d3.interpolate(shallowp, deepp);
        d3.select('body').on('keydown', function(){
            increase = !increase;
        });
        d3.interval(() => {
            if (increase) {
                time_offset += 10;
            }
            time_offset %= 361;

            g.nodes().forEach((v, i) => {
                let node = g.node(i);
                
                if (typeof event_result[id2event[i]] !== 'undefined' && event_result[id2event[i]][1].final_result === 'Happen'){
                    nd.select('#node' + i)
                    .select('path')
                    .datum({endAngle: time_offset / 180 * Math.PI})
                    .style('fill', compute(time_offset/360))
                    .attr('d', arcGenerator);
                }
            })            
        }, 100);

        
        // ================= text on edge path ==================  
        let edge_labels = new Array(edges.length);
        g.edges().forEach((v, i) => {
            let lb = g.edge(v).name;
            edge_labels[i] = lb;
        });
        
        let pp = svgGroup.selectAll('g.edgePath');
        pp.each(function(p, i) {
            d3.select(this).select('path').attr('id', 'path'+i);
            d3.select(this)
            .append('text').attr('text-anchor', 'middle')
            .append('textPath').attr('href', '#path'+i).attr('startOffset', '50%')
            .text(edge_labels[i]);
        });


        // ================= tooltip ==================    
        // for nodes        
        svgGroup.selectAll('g.node').on('mouseover', function(v, i) {
            let tt = d3.select("#tooltip")
            .attr("style", "left:" + v.pageX + "px" + "; top:" + v.pageY + "px")
            .select("#tooltip_value").append('span');

            tt.append('span').text('Node Type: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.node(i).node_type);
            tt.append('br');

            tt.append('span').text('Start Time: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.node(i).start_time);
            tt.append('br');

            tt.append('span').text('End Time: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.node(i).end_time);
            tt.append('br');
            
            tt.append('span').text('Final Result: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.node(i).final_result);

            d3.select("#tooltip").classed("hidden", false);
        });
       
        svgGroup.selectAll("g.node").on('mouseout', function (v, i) {
            d3.select("#tooltip").classed("hidden", true);
            let tt = d3.select("#tooltip")
            .attr("style", "left:" + v.pageX + "px" + "; top:" + v.pageY + "px")
            .select("#tooltip_value");
            tt.selectAll('span').remove();
        });

        // for edges
        svgGroup.selectAll('g.edgePath').on('mouseover', function(v, i) {
            let tt = d3.select("#tooltip")
            .attr("style", "left:" + v.pageX + "px" + "; top:" + v.pageY + "px")
            .select("#tooltip_value");

            tt.append('span').text('Action Name: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.edge(i).label);
            tt.append('br');

            tt.append('span').text('Action Type: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.edge(i).action_type);
            tt.append('br');

            tt.append('span').text('Start Time: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.edge(i).start_time);
            tt.append('br');

            tt.append('span').text('End Time: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.edge(i).end_time);
            tt.append('br');

            tt.append('span').text('Fnial Result: ').attr('style', 'font-weight:500');
            tt.append('span').text(g.edge(i).final_result);

            d3.select("#tooltip").classed("hidden", false);
        });
       
        svgGroup.selectAll("g.edgePath").on('mouseout', function (v, i) {
            d3.select("#tooltip").classed("hidden", true);
            d3.select('#tooltip_value').selectAll('span').remove();
            d3.select('#tooltip_value').selectAll('br').remove();
        });

    }

  
    useEffect(() => {
        renderDag();
    }, []);

    return (
        <div>
            <svg id="svg-canvas"  width= '3000' height='3000' >
                
            </svg>
            <div id='tooltip' className='hidden'>
                <p align='center'><strong>Tooltip:</strong></p>
                <p id='tooltip_value'></p>
            </div>
        </div>
    );

}


export default Graph;
