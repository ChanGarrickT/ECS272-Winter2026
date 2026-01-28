import { Paper, Divider, Button, Grid, Stack, Box, Tooltip } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import countryCodes from '../../data/countryCodes.json';

export default function CountryTag(props){
    return (
        <Tooltip key={props.country} title={countryCodes[props.country]} placement='top'>
            <Box key={props.country} className='country-tag' sx={{color: props.color, cursor: 'default'}}>
                {props.country}
                <span className="x-button" onClick={() => props.removeCountry(props.index, props.color)}>×</span>
            </Box>
        </Tooltip>
    )
}