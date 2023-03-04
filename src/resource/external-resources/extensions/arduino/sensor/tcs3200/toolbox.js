/* eslint-disable func-style */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
function addToolbox () {
    return `
<category name="%{BKY_TCS3200_CATEGORY}" id="TCS3200_CATEGORY" colour="#AE00AE" secondaryColour="#930093">
    <block type="tcs3200_init" id="dht_init">
        <field name="S0">2</field>
        <field name="S1">3</field>
        <field name="S2">4</field>
        <field name="S3">6</field>
        <field name="OE">7</field>
    </block>
    <block type="tcs3200_getColorValue" id="tcs3200_getColorValue">
        <field name="COLOR">red</field>
        <value name="CALIBRATION">
            <shadow type="math_whole_number">
                <field name="NUM">20</field>
            </shadow>
        </value>
    </block>
</category>`;
}

exports = addToolbox;
