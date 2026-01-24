import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import countryCodes from '../../data/countryCodes.json';

export default function CountryTag(props){
    return (
        <Box key={props.country} sx={{color: props.color}}>
            {props.country}
            <span className="x-button" onClick={() => props.removeCountry(props.idx, props.color)}>×</span>
        </Box>
    )
}