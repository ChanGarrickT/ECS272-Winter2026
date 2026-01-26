import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import * as d3 from "d3";
import { filter, isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import WorldMap from '../../data/countries-110m.json'
import countryCodes from '../../data/countryCodes.json';

export default function CountryList(){
    return (
        <Box>
            <select id='country-select'>
                {Object.keys(countryCodes).map((code) => {
                    return <option key={code} value={code}>{code} - {countryCodes[code]}</option>                                     
                })}
            </select>
        </Box>
    )
}