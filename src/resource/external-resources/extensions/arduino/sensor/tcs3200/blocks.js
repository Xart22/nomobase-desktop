/* eslint-disable func-style */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
function addBlocks (Blockly) {
    const color = '#AE00AE';
    const secondaryColour = '#930093';

    const digitalPins = Blockly.getMainWorkspace().getFlyout()
        .getFlyoutItems()
        .find(block => block.type === 'arduino_pin_setDigitalOutput')
        .getField('PIN')
        .getOptions();

    Blockly.Blocks.tcs3200_init = {
        init: function () {
            this.jsonInit({
                message0: Blockly.Msg.TCS3200_INIT,
                args0: [
                    {
                        type: 'field_dropdown',
                        name: 'S0',
                        options: digitalPins
                    },
                    {
                        type: 'field_dropdown',
                        name: 'S1',
                        options: digitalPins
                    },

                    {
                        type: 'field_dropdown',
                        name: 'S2',
                        options: digitalPins
                    },
                    {
                        type: 'field_dropdown',
                        name: 'S3',
                        options: digitalPins
                    },
                    {
                        type: 'field_dropdown',
                        name: 'OE',
                        options: digitalPins
                    }
                ],
                tooltip: Blockly.Msg.TCS3200_INIT_TOOLTIP,
                colour: color,
                secondaryColour: secondaryColour,
                extensions: ['shape_statement']
            });
        }
    };

    Blockly.Blocks.tcs3200_calibrateWhite = {
        init: function () {
            this.jsonInit({
                message0: Blockly.Msg.TCS3200_CALIBRATEWHITE,
                colour: color,
                secondaryColour: secondaryColour,
                extensions: ['shape_statement']
            });
        }
    };

    Blockly.Blocks.tcs3200_calibrateBlack = {
        init: function () {
            this.jsonInit({
                message0: Blockly.Msg.TCS3200_CALIBRATEBLACK,
                colour: color,
                secondaryColour: secondaryColour,
                extensions: ['shape_statement']
            });
        }
    };


    Blockly.Blocks.tcs3200_measureColor = {
        init: function () {
            this.jsonInit({
                message0: Blockly.Msg.TCS3200_MEASURECOLOR,
                colour: color,
                secondaryColour: secondaryColour,
                extensions: ['shape_statement']
            });
        }
    };

    Blockly.Blocks.tcs3200_getColorValue = {
        init: function () {
            this.jsonInit({
                message0: Blockly.Msg.TCS3200_GETCOLORVALUE,
                args0: [
                    {
                        type: 'field_dropdown',
                        name: 'COLOUR',
                        options: [
                            [Blockly.Msg.TCS3200_COLOR_RED, 'r'],
                            [Blockly.Msg.TCS3200_COLOR_GREEN, 'g'],
                            [Blockly.Msg.TCS3200_COLOR_BLUE, 'b'],
                        ]
                    },
                    {
                        type: 'field_dropdown',
                        name: 'CALIBRATION',
                        options: [
                            ['0', 0],
                            ['20', 20],
                            ['100', 100],
                        ]
                    }
                ],
                colour: color,
                secondaryColour: secondaryColour,
                extensions: ['output_number']
            });
        }
    };

    return Blockly;
}

exports = addBlocks;
