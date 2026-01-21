import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from "d3";
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import WorldMap from '../../data/countries-110m.json'
import countryCodes from '../../data/countryCodes.json';
import { feature, mesh } from "topojson-client";

export default function World(props){
    const [filteredMedals, setFilteredMedals] = useState([])
    const worldRef = useRef(null);

    const [size, setSize] = useState({ width: 0, height: 0 });

    const onResize = useDebounceCallback((size) => setSize(size), 200);

    useResizeObserver({ ref: worldRef, onResize });

    useEffect(() => {
        if (isEmpty(WorldMap)) return;
        if (size.width === 0 || size.height === 0) return;
        d3.select('#world-svg').selectAll('*').remove();
        let filteredMedalCounts = {}
        filteredMedals.forEach(entry => {
            if(filteredMedalCounts[entry.country]){
                filteredMedalCounts[entry.country]++;
            } else {
                filteredMedalCounts[entry.country] = 1;
            }
        });
        console.log(filteredMedalCounts)
        drawChart(worldRef.current, size, filteredMedalCounts);
    }, [props, size]);

    useEffect(() => {
		if(props.medalCsv == null) return;
		if(props.selectedCountries == null) return;
		if(props.selectedDates == null) return;
		setFilteredMedals(props.medalCsv.filter((entry) => {
			const dateIsSelected = props.selectedDates.includes(entry.date);
			let countryIsSelected = false;
			for(let i = 0; i < props.selectedCountries.length; i++){
				if (props.selectedCountries[i].country === entry.countryCode){
					countryIsSelected = true;
					break;
				}
			}
			return dateIsSelected && countryIsSelected;
		}));
		console.log(filteredMedals);
	}, [props.medalCsv, props.selectedCountries, props.selectedDates])

    return (
        <Paper elevation={3} sx={{height: '100%', boxSizing: 'border-box', padding: '10px'}}>
            <Stack id='world-panel' spacing={1} sx={{height: '100%'}}>
                <Paper sx={{marginTop: '10px'}}>
                    <Stack id='world-widgets' direction={'row'} sx={{ margin: '5px'}}>
                        <Button>Widget 1</Button>
                        <Button>Widget 2</Button>
                    </Stack>
                </Paper>
                <Paper sx={{flex: 1}}>
                    <Box id='world-content' sx={{width: '100%', height: '100%'}}>
                        <svg id='world-svg' ref={worldRef} width='100%' height='100%'></svg>
                    </Box>
                </Paper>
            </Stack>
        </Paper>
    )
}

function drawChart(svgElement, size, filteredMedalCounts){
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();    // clear previous render
    const centerX = size.width / 2;
    const centerY = size.height / 2; 

    const colorScale = d3.scaleLinear()
        .domain([0, 1, 10])
        .range(['#ddd', '#fd0', '#a80'])

    const proj = d3.geoNaturalEarth1()
        .scale(0.35 * Math.min(size.width, size.height))
        .center([0, 0])
        .translate([centerX, centerY]);

    const mapPath = d3.geoPath().projection(proj);

    const g = svg.append('g');

    const countries = g.append('g')
        .selectAll('path')
        .data(feature(WorldMap, WorldMap.objects.countries).features)
        .join('path')
        .attr('id', (d) => `country-geo-${d.properties.name}`)
        .attr('class', 'country-geo')
        .attr('fill', function(d){
            if(filteredMedalCounts[d.properties.name]){
                return colorScale(filteredMedalCounts[d.properties.name]);
            } else {
                return '#ddd';
            }
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('d', mapPath)

    return svg.node()
}