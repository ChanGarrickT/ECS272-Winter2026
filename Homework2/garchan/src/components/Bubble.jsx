import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import eventToCountryJson from '../../data/eventToCountryHierarchyWithNamesDates.json'
import countryCodes from '../../data/countryCodes.json'

const margin = { top: 10, right: 170, bottom: 40, left: 50 };

// Color scale
const colorScale = d3.scaleLinear()
    .domain([0, 3])
    .range(['white', '#ddd'])
    .interpolate(d3.interpolateHcl);

export default function Bubble(props){
    const [athleteInfo, setAthleteInfo] = useState({});
    const [highlightEvents, setHighlightEvents] = useState(true);
    const bubbleRef = useRef(null);
    const bubbleContainerRef = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });

    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: bubbleContainerRef, onResize });

    useEffect(() => {
        // Read JSON once HTML element is loaded
        if (isEmpty(eventToCountryJson)) return;
        setAthleteInfo(eventToCountryJson);
    }, []);

    // Redraw when panel size changes
    useEffect(() => {
        if (isEmpty(athleteInfo)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#bubble-svg').selectAll('*').remove();
        
        drawChart(bubbleRef.current, athleteInfo, size, props);
        highlightBubble(highlightEvents, props.selectedDates);
    }, [athleteInfo, size]);

    // Handle coloring circles independent of zoom
    useEffect(() => {
        highlightBubble(highlightEvents, props.selectedDates);
    }, [props.selectedDates, highlightEvents])

    return (
        <Paper elevation={3} sx={{height: '100%', boxSizing: 'border-box', padding: '10px', minHeight: 0}}>
            <Stack id='bubble-panel' spacing={1} sx={{height: '100%'}}>
                <Paper sx={{marginTop: '10px'}}>
                    <Stack id='bubble-widgets' direction={'row'} sx={{ margin: '5px'}}>
                        <Button variant='outlined' onClick={() => setHighlightEvents((prev) => !prev)}>Toggle Highlight Events by Dates</Button>
                    </Stack>
                </Paper>
                <Paper sx={{flex: 1, minHeight: 0}}>
                    <Box id='bubble-content' ref={bubbleContainerRef} sx={{height: '100%', flex: 1, minHeight: 0}}>
                        <svg id='bubble-svg' ref={bubbleRef} style={{ width: '100%', height: '100%', minHeight: 0 }}></svg>
                        <span id='bubble-focus'></span>
                    </Box>
                </Paper>
            </Stack>
        </Paper>
    )
}

function drawChart(svgElement, bubbleInfo, size, props){
    const minDim = Math.min(size.width, size.height);

    const svg = d3.select(svgElement)
        .attr('viewBox', `0 0 ${size.width} ${size.height}`)
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'block');
    svg.selectAll('*').remove();    // clear previous render
    
    // Pack
    const pack = data => d3.pack()
        .size([minDim, minDim])
        .padding(3)
        (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));
    const root = pack(bubbleInfo);

    // Draw circles
    const node = svg.append('g')
        .attr('transform', `translate(${(size.width) / 2}, ${size.height / 2})`)
        .selectAll('circle')
        .data(root.descendants().slice(1)) // slice(1) to not draw root
        .join('circle')
        .attr('fill', d => colorScale(d.depth))
        .attr('pointer-events', d => !d.children ? 'none' : null) // clicking on leaf triggers parent
        .attr('class', d => d.depth === 2 ? `bubbles bubble-d2 bubble-${d.data.dates[0]}` : 'bubbles')
        .on('click', function(event, d) {
             if(focus !== d){ 
                zoom(event, d);
                d3.select('#bubble-focus').text(d.data.name);
                if(d.children){props.setHighlightedDates(d.data.dates);}         
                event.stopPropagation();
            }
        });

    // Draw labels
    const label = svg.append('g')
        .style('font-size', '0.8rem')
        .attr('transform', `translate(${(size.width) / 2}, ${size.height / 2})`)
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .selectAll('text')
        .data(root.descendants())
        .join('text')
            .style('fill-opacity', d => d.parent === root ? 1 : 0)
            .style('display', d => d.parent === root ? "inline" : "none")
            .text(d => d.children ? d.data.name : countryCodes[d.data.name])
    
    // Zoom to root by default or by clicking background
    svg.on('click', function(e){
        zoom(e, root);
        d3.select('#bubble-focus').text('');
        props.setHighlightedDates([]);
    });
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    // Reused from https://observablehq.com/@d3/zoomable-circle-packing
    function zoomTo(v) {
        const k = minDim / v[2];

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(event, d){
        focus = d;

        const transition = svg.transition()
            .duration(event.altKey ? 7500 : 750)
            .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
            });

        label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    return svg.node();
}

// Highlight events in which the medal ceremony was on a day selected by the user
function highlightBubble(highlight, selectedDates){
    d3.selectAll('.bubble-d2')
        .attr('fill', colorScale(2))
    if(highlight){
        for(let i = 0; i < selectedDates.length; i++){
            d3.selectAll(`.bubble-${selectedDates[i]}`)
                .attr('fill', '#FFF096')  
        }      
    }
}