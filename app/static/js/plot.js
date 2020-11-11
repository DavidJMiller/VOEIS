class Plot {
    /* main, bottom, secondary, ternary, text */
    constructor(plotID, plotType) {
        this.plot = d3.select('#' + plotID);
        this.plotType = plotType;
        this.visType = new Map();

        this.visType.set('scatter', Visualizations.scatter);
    }

    /* get appropriate function and send it data to plot */
    drawPlot(data) {
        this.visType.get(this.plotType)(data);
    }
}

class Visualizations {
    /* we are getting dictionary of form
        x:[size n]
        y:[size n]
        yLabel:string
        xLabel:string
        title:string
        magnitudes:[size n]
    */
    static scatter(data) {
        // create scale for axis
        // set labels and title
        // plot
    }
}
