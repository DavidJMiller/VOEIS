class View {
    constructor() {
        this.mainPlot = new Plot('main-view-svg', 'scatter');
        this.bottomPlot = new Plot('bottom-plot-svg', 'scatter');
        this.secondaryPlot = new Plot('secondary-plot-svg', 'scatter');
        this.ternaryPlot = new Plot('ternary-plot-svg', 'scatter');
        this.textPlot = new Plot('text-plot-svg', 'scatter');

        this.plotFuncs = new Map();
        this.plotFuncs.set(this.mainPlot, Functions.defaultMain);
        this.plotFuncs.set(this.bottomPlot, Functions.defaultMain);
        this.plotFuncs.set(this.secondaryPlot, Functions.defaultMain);
        this.plotFuncs.set(this.ternaryPlot, Functions.defaultMain);
        this.plotFuncs.set(this.textPlot, Functions.defaultMain);
    }

    /* list of jsons for presets */
    sequencePresets = [];
    numberPresets = [];

    /* change views
        newView: string
     */
    changeView(newView) {}

    /* user searched for a sequence or selected one from history
        sequence: json
     */
    plotSequence(sequence) {}

    /* number is search or selected from history
        number: json
    */
    plotNumber(number) {}

    /* load a preset
        index: int corresponding to preset
    */
    loadSequencePreset(index) {}

    /* load a preset
        index: int corresponding to preset
    */
    loadNumberPreset(index) {}

    /* call dbHandler to get the preset sequences/numbers */
    loadPresets() {
        /* populate preset lists */
    }
}

class Functions {
    static defaultMain(json) {
        return {
            x: [1, 2, 3],
            y: [1, 4, 9],
            xLabel: 'xLabel',
            yLabel: 'yLabel',
            title: 'title',
            magnitude: [2, 3, 5]
        };
    }
}
