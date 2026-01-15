import React from 'react'
import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import eventToCountryJson from '../../data/eventToCountryHierarchy.json'

const margin = { top: 10, right: 170, bottom: 40, left: 50 };

export default function Bubble(){
    const [athleteInfo, setAthleteInfo] = useState({});
    const bubbleRef = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });

    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: bubbleRef, onResize });

    useEffect(() => {
        // Read JSON once HTML element is loaded
        if (isEmpty(eventToCountryJson)) return;
        setAthleteInfo(eventToCountryJson);
        }, []);

    useEffect(() => {
        if (isEmpty(athleteInfo)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#bubble-svg').selectAll('*').remove();
        
        drawChart(bubbleRef.current, athleteInfo, size);
    }, [athleteInfo, size]);

    return (
        <Paper elevation={3} sx={{height: '100%', boxSizing: 'border-box', padding: '10px'}}>
            <Stack id='bubble-panel' spacing={1} sx={{height: '100%'}}>
                <Paper sx={{marginTop: '10px'}}>
                    <Stack id='bubble-widgets' direction={'row'} sx={{ margin: '5px'}}>
                        <Button>Widget 1</Button>
                        <Button>Widget 2</Button>
                    </Stack>
                </Paper>
                <Paper sx={{flex: 1}}>
                    <Box id='bubble-content' sx={{flex: 1}}>
                        <svg id='bubble-svg' ref={bubbleRef} style={{ width: '100%', height: '100%' }}></svg>
                    </Box>
                </Paper>
            </Stack>
        </Paper>
    )
}

function drawChart(svgElement, bubbleInfo, size){
    const minDim = Math.min(size.width, size.height);
    console.log(minDim);

    const svg = d3.select(svgElement)
        .attr('viewBox', `-${minDim / 2} -${minDim / 2} ${minDim} ${minDim}`)
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'block');
    svg.selectAll('*').remove();    // clear previous render

    // Color scale
    const colorScale = d3.scaleLinear()
        .domain([0, 3])
        .range(['white', '#555'])
        .interpolate(d3.interpolateHcl);
    
    // Pack
    const pack = data => d3.pack()
        .size([minDim, minDim])
        .padding(3)
        (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));
    const root = pack(bubbleInfo);

    // Create container

    // Draw circles
    const node = svg.append('g')
        .selectAll('circle')
        .data(root.descendants().slice(1)) // slice(1) to not draw root
        .attr('fill', d => colorScale(d.depth))

    // Draw labels
    const label = svg.append('g')
        .style('font-size', '1rem')
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .selectAll('text')
        .data(root.descendants())
        .join('text')
            .style('fill-opacity', d => d.parent === root ? 1 : 0)
            .style('display', d => d.parent === root ? "inline" : "none")
            .text(d => d.data.name)
    
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
        const k = minDim / v[2];

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    return svg.node();
}