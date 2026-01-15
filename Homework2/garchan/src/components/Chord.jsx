import React from 'react'
import { Paper, Divider, Button, Grid, Stack, Box } from '@mui/material';
import { useState } from 'react';

export default function Chord(){
    return (
        <Paper elevation={3} sx={{height: '100%', boxSizing: 'border-box', padding: '10px'}}>
            <Stack id='chord-panel' spacing={1} sx={{height: '100%'}}>
                <Paper sx={{marginTop: '10px'}}>
                    <Stack id='chord-widgets' direction={'row'} sx={{ margin: '5px'}}>
                        <Button>Widget 1</Button>
                        <Button>Widget 2</Button>
                    </Stack>
                </Paper>
                <Paper sx={{flex: 1}}>
                    <Box id='chord-content' sx={{flex: 1}}>
                        Chord
                    </Box>
                </Paper>
            </Stack>
        </Paper>
    )
}