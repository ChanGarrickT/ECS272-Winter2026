import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import countryCodes from '../../data/countryCodes.json';

const margin = { top: 10, right: 40, bottom: 25, left: 50 };

const daylist = [
    '2024-07-27', '2024-07-28', '2024-07-29', '2024-07-30',
    '2024-07-31', '2024-08-01', '2024-08-02', '2024-08-03',
    '2024-08-04', '2024-08-05', '2024-08-06', '2024-08-07',
    '2024-08-08', '2024-08-09', '2024-08-10', '2024-08-11'
]

export default function Timeline(props){
    const medalTallyRef = useRef(null);
    const timelineContainerRef = useRef(null);

    // Track previous state for animation
    const prevSelectedMedals = useRef(null);
    const prevYMax = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });   
    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: medalTallyRef, onResize });

    // Draw chart when data is updated or window resized
    useEffect(() => {
        if (isEmpty(props.medalTally)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#medalTally-svg').selectAll('*').remove();
        const maxMedalCount = getMedalExtent(props.medalTally, props.selectedCountries, props.selectedMedals)
        drawChart(medalTallyRef.current, timelineContainerRef.current, maxMedalCount, null, null, size, props);
        prevSelectedMedals.current = props.selectedMedals;
        prevYMax.current = maxMedalCount;
    }, [props.medalTally, props.selectedCountries, props.highlightedDates, props.selectedDates, size]);

    // Animate lines when medal filter changes
    useEffect(() => {
        if (isEmpty(props.medalTally)) return;
        d3.select('#medalTally-svg').selectAll('*').remove();
        const maxMedalCount = getMedalExtent(props.medalTally, props.selectedCountries, props.selectedMedals)
        drawChart(medalTallyRef.current, timelineContainerRef.current, maxMedalCount, prevSelectedMedals.current, prevYMax.current, size, props);
        prevSelectedMedals.current = props.selectedMedals;
        prevYMax.current = maxMedalCount;
    }, [props.selectedMedals]);

    // Add listeners to widgets
    useEffect(() => {
        d3.select('#gold-check')
            .on('change', event => props.setSelectedMedals(prev => ({...prev, gold: Number(event.target.checked)})));
        d3.select('#silver-check')
            .on('change', event => props.setSelectedMedals(prev => ({...prev, silver: Number(event.target.checked)})));
        d3.select('#bronze-check')
            .on('change', event => props.setSelectedMedals(prev => ({...prev, bronze: Number(event.target.checked)})));
        d3.select('#select-all-dates')
            .on('click', event => props.setSelectedDates(daylist));
        d3.select('#clear-all-dates')
            .on('click', event => props.setSelectedDates([]));
    }, []);

    return (
        <Paper elevation={3} ref={timelineContainerRef} sx={{height: '100%', padding: '10px'}}>
            <Grid container id='medalTally-panel' sx={{height: '100%'}}>
                <Grid size={10.5}>
                    <Paper id='medalTally-content'  sx={{height: '100%', marginRight: '3px'}}>
                        <svg id='medalTally-svg' ref={medalTallyRef} width='100%' height='100%'></svg>
                    </Paper>
                </Grid>
                <Grid size={1.5}>
                    <Paper id='medalTally-widgets' sx={{height: '100%', marginLeft: '3px'}}>
                        <Stack>
                            <Box sx={{margin: '5px 7px'}}>
                                <input type='checkbox' id='gold-check' name='gold-check' style={{cursor: 'pointer'}} defaultChecked/>
                                <label htmlFor="gold-check" style={{fontSize: '0.75rem', cursor: 'pointer'}}> 🥇 Gold</label><br />
                            </Box>
                            <Box sx={{margin: '5px 7px'}}>
                                <input type='checkbox' id='silver-check' name='silver-check' style={{cursor: 'pointer'}} defaultChecked/>
                                <label htmlFor="silver-check" style={{fontSize: '0.75rem', cursor: 'pointer'}}> 🥈 Silver</label><br />
                            </Box>
                            <Box sx={{margin: '5px 7px'}}>
                                <input type='checkbox' id='bronze-check' name='bronze-check' style={{cursor: 'pointer'}} defaultChecked/>
                                <label htmlFor="bronze-check" style={{fontSize: '0.75rem', cursor: 'pointer'}}> 🥉 Bronze</label><br />
                            </Box>
                            <br />
                            <Button id='select-all-dates' variant='outlined' sx={{fontSize: '0.65rem', margin: '5px 5px'}}>All 📅</Button>
                            <Button id='clear-all-dates' variant='outlined' sx={{fontSize: '0.65rem', margin: '5px 5px'}}>Clear 📅</Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    )
}

function drawChart(svgElement, timelineElement, maxMedalCount, prevSelectedMedals, prevYMax, size, props){
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();    // clear previous render

    // Tooltip logic
    d3.select(timelineElement).selectAll('.tooltip').remove();
    const tooltip = d3.select(timelineElement).append('div')
        .attr('class', 'tooltip')
        .style('left', `${timelineElement.getBoundingClientRect().x + timelineElement.getBoundingClientRect().width/2}px`)
        .style('bottom', `${timelineElement.getBoundingClientRect().height * 1.6}px`);

    // Define scales
    const xScale = d3.scaleTime()
        .domain([d3.timeParse("%Y-%m-%d")([props.medalTally[0].date]), d3.timeParse("%Y-%m-%d")([props.medalTally.at(-1).date])])
        .range([margin.left, size.width - margin.right]);   
    const yScale = d3.scaleLinear()
        .domain([0, maxMedalCount])
        .range([size.height - margin.bottom, margin.top]);
    const prevYScale = prevYMax ? d3.scaleLinear().domain([0, prevYMax]).range([size.height - margin.bottom, margin.top]) : null;

    // Highlight dates based on bubble chart
    const x1 = d3.timeParse("%Y-%m-%d")('2024-07-27');
    const x2 = d3.timeDay.offset(x1, 1);
    const highlightWidth = (xScale(x2) - xScale(x1)); // Width of 1 day

    const wideBoxes = svg.append('g')
        .selectAll('rect')
        .data(props.highlightedDates)
        .join('rect')
        .attr('x', d => xScale(d3.timeParse("%Y-%m-%d")(d)) - highlightWidth / 2)
        .attr('y', margin.top)
        .attr('width', highlightWidth)
        .attr('height', size.height - margin.top - margin.bottom)
        .attr('fill', '#dff')

    // Highlight selected dates
    const narrowBoxes = svg.append('g')
        .selectAll('rect')
        .data(daylist)
        .join('rect')
        .attr('x', d => xScale(d3.timeParse("%Y-%m-%d")(d)) - highlightWidth / 2)
        .attr('y', margin.top)
        .attr('width', highlightWidth)
        .attr('height', size.height - margin.top - margin.bottom)
        .attr('class', d => props.selectedDates.includes(d) ? 'date-selected' : 'date-unselected')
        .style('cursor', 'pointer')
        .on('click', function (event, d) {
            props.setSelectedDates(prev => {
                if (prev.includes(d)) {
                    return prev.filter(date => date !== d);
                } else {
                    return [...prev, d];
                }
            });
        })
        .on('mouseover', function(event, d){ showToolTip(tooltip, this, props, d) })
        .on('mouseout', function(event, d){ hideToolTip(tooltip)})

    // Draw axes
    const xAxis = svg.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(17));
    const yAxis = svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(8));

    // Draw axis labels
    // svg.append('g')
    //     .attr('transform', `translate(${size.width / 2 - margin.left}, ${size.height - 8})`)
    //     .append('text')
    //     .text('Date')
    //     .style('font-size', '0.8rem');
    svg.append('g')
        .attr('transform', `translate(20, ${(size.height - margin.bottom) / 2 + 37}) rotate(-90)`)
        .append('text')
        .text('Medal Count')
        .style('font-size', '0.8rem');
    
    // Draw lines and their labels
    // const paths = [];
    if(!prevSelectedMedals){
        props.selectedCountries.forEach(c => {
            svg.append('path')
                .datum(props.medalTally)
                .attr('fill', 'none')
                .attr('stroke', c.color)
                .attr('stroke-width', 1)
                .attr('d', d3.line()
                    .x(m => xScale(d3.timeParse("%Y-%m-%d")(m.date)))
                    .y(m => yScale(props.selectedMedals.gold * m[c.country].gold +
                                   props.selectedMedals.silver * m[c.country].silver +
                                   props.selectedMedals.bronze * m[c.country].bronze))
                )
        });
    } else {
        props.selectedCountries.forEach(c => {
            svg.append('path')
                .datum(props.medalTally)
                .attr('fill', 'none')
                .attr('stroke', c.color)
                .attr('stroke-width', 1)
                .attr('d', d3.line()
                    .x(m => xScale(d3.timeParse("%Y-%m-%d")(m.date)))
                    .y(m => prevYScale(prevSelectedMedals.gold * m[c.country].gold +
                                       prevSelectedMedals.silver * m[c.country].silver +
                                       prevSelectedMedals.bronze * m[c.country].bronze))
                )
                .transition()
                .duration(150)
                .attr('d', d3.line()
                    .x(m => xScale(d3.timeParse("%Y-%m-%d")(m.date)))
                    .y(m => yScale(props.selectedMedals.gold * m[c.country].gold +
                                   props.selectedMedals.silver * m[c.country].silver +
                                   props.selectedMedals.bronze * m[c.country].bronze))
                )

        });
    }
}

function getMedalExtent(medalTally, countries, medals){
    let highest = 0;
    const lastDay = medalTally.at(-1);
    countries.forEach(c => highest = Math.max(highest, medals.gold * lastDay[c.country].gold + 
                                                       medals.silver * lastDay[c.country].silver +
                                                       medals.bronze * lastDay[c.country].bronze));
    return highest;
}

function showToolTip(tooltip, box, props, d){
    tooltip.selectAll('*').remove()
    const tallyEntry = props.medalTally[daylist.indexOf(d) + 1]
    tooltip.append('h3').text('Total to Date:')
    for(let i = 0; i < props.selectedCountries.length; i++){
        const country = props.selectedCountries[i].country
        const count = props.selectedMedals.gold * tallyEntry[country].gold +
                        props.selectedMedals.silver * tallyEntry[country].silver +
                        props.selectedMedals.bronze * tallyEntry[country].bronze;
        tooltip.append('p')
            .style('color', `${props.selectedCountries[i].color}`)
            .text(`${countryCodes[country]}: ${count}`)
    }
    
    tooltip.transition()
        .duration(150)
        .style('left', `${box.getBoundingClientRect().x}px`)
        .style('bottom', `${box.getBoundingClientRect().height * 1.6}px`)
        .style('opacity', 1)      
}

function hideToolTip(tooltip){
    tooltip.transition()
        .duration(150)
        .style('opacity', 0)
}