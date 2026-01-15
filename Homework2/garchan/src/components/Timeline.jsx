import React, { use } from 'react'
import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import getEmptyRow from './countryMedalCount';
import countryCodes from '../../data/countryCodes.json';

const margin = { top: 10, right: 170, bottom: 40, left: 50 };

export default function Timeline(){
    const [medalTally, setMedalTally] = useState([]);
    const medalTallyRef = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });

    const [selectedCountries, setSelectedCountries] = useState([]);
    const top5 = [
        {country: 'USA', color: 'dodgerblue'},
        {country: 'CHN', color: 'crimson'},
        {country: 'JPN', color: 'lightseagreen'},
        {country: 'AUS', color: 'orange'},
        {country: 'FRA', color: 'mediumorchid'}
    ];

    const [colorPalette, setColorPalette] = useState([]);
    
    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: medalTallyRef, onResize });
    
    useEffect(() => {
    // Read CSV once HTML element is loaded
    const dataFromCSV = async () => {
        try {
            const csvData = await d3.csv('../../data/medals.csv', d => {
                // This callback allows you to rename the keys, format values, and drop columns you don't need
                return {date: d.medal_date, medal: parseInt(d.medal_code), countryCode: d.country_code, country: d.country, sport: d.discipline};
            });
            setMedalTally(tally(csvData));
            setSelectedCountries(top5);
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    } 
        dataFromCSV();
    }, []);

    useEffect(() => {
        if (isEmpty(medalTally)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#medalTally-svg').selectAll('*').remove();
        
        drawChart(medalTallyRef.current, medalTally, selectedCountries, size);
    }, [medalTally, selectedCountries, size]);

    return (
        <Paper elevation={3} sx={{height: '100%', padding: '10px'}}>
            <Grid container id='medalTally-panel' sx={{height: '100%'}}>
                <Grid size={10}>
                    <Paper id='medalTally-content' sx={{height: '100%', marginRight: '3px'}}>
                        <svg id='medalTally-svg' ref={medalTallyRef} width='100%' height='100%'></svg>
                    </Paper>
                </Grid>
                <Grid size={2}>
                    <Paper id='medalTally-widgets' sx={{height: '100%', marginLeft: '3px'}}>
                        <Stack>
                            <Button>Widget 1</Button>
                            <Button>Widget 2</Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    )
}

function drawChart(svgElement, medalTally, countries, size){
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();    // clear previous render

    // Define scales
    const xScale = d3.scaleTime()
        .domain([d3.timeParse("%Y-%m-%d")([medalTally[0].date]), d3.timeParse("%Y-%m-%d")([medalTally.at(-1).date])])
        .range([margin.left, size.width - margin.right]);   
    const yScale = d3.scaleLinear()
        .domain([0, getMedalExtent(medalTally, countries)])
        .range([size.height - margin.bottom, margin.top]);

    // Draw axes
    const xAxis = svg.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(9));
    const yAxis = svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(8));

    // Draw axis labels
    svg.append('g')
        .attr('transform', `translate(${size.width / 2 - margin.left}, ${size.height - 8})`)
        .append('text')
        .text('Date')
        .style('font-size', '0.8rem');
    svg.append('g')
        .attr('transform', `translate(20, ${(size.height - margin.bottom) / 2 + 37}) rotate(-90)`)
        .append('text')
        .text('Medal Count')
        .style('font-size', '0.8rem');
    
    // Draw lines and their labels
    const paths = [];
    countries.forEach(c => {
        svg.append('path')
            .datum(medalTally)
            .attr('fill', 'none')
            .attr('stroke', c.color)
            .attr('stroke-width', 1)
            .attr('d', d3.line()
                .x(m => xScale(d3.timeParse("%Y-%m-%d")(m.date)))
                .y(m => yScale(m[c.country].gold + m[c.country].silver + m[c.country].bronze))
            )

        svg.append('g')
            .append('text')
            .attr('transform', `translate(${size.width - margin.right + 5}, ${3 + yScale(medalTally.at(-1)[c.country].gold + medalTally.at(-1)[c.country].silver + medalTally.at(-1)[c.country].bronze)})`)
            .text(countryCodes[c.country] + ' - ' + (medalTally.at(-1)[c.country].gold + medalTally.at(-1)[c.country].silver + medalTally.at(-1)[c.country].bronze))
            .style('fill', c.color)
            .style('font-size', '0.7rem')
        }
    );
}

const medalCodeToType = {1: 'gold', 2: 'silver', 3: 'bronze'};

function tally(data){
    let currentDate = '2024-07-26';
    let currentTally = getEmptyRow();
    let results = []
    data.forEach(d => {
        if(currentDate !== d.date){
            results.push(JSON.parse(JSON.stringify({date: currentDate, ...currentTally})));
            currentDate = d.date;
        }
        currentTally[d.countryCode][medalCodeToType[d.medal]]++;
    })
    results.push(JSON.parse(JSON.stringify({date: currentDate, ...currentTally})));
    return results;
}

function getMedalExtent(medalTally, countries){
    let highest = 0;
    const lastDay = medalTally.at(-1);
    countries.forEach(c => highest = Math.max(highest, lastDay[c.country].gold + lastDay[c.country].silver + lastDay[c.country].bronze));
    return highest;
}