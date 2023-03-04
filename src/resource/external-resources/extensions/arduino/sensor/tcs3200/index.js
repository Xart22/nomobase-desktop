const tcs3200 = (formatMessage) => ({
    name: "TCS3200",
    extensionId: "tcs3200",
    version: "1.0.0",
    supportDevice: [
        "arduinoUno",
        "arduinoNano",
        "arduinoLeonardo",
        "arduinoNano2",
        "arduinoMega2560",
    ],
    author: "Panjkrc",
    iconURL: `asset/tcs3200.png`,
    description: formatMessage({
        id: "tcs3200.description",
        default: "Color sensor module based on TCS3200.",
    }),
    featured: true,
    blocks: "blocks.js",
    generator: "generator.js",
    toolbox: "toolbox.js",
    msg: "msg.js",
    library: "lib",
    official: true,
    tags: ["sensor"],
    helpLink: "https://wiki.openblock.cc",
});

module.exports = tcs3200;
