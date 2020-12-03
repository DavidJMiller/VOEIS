/**
 * Provides functions that calculate or plot statistics about numbers and
 * sequences.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 12/03/20
 */
class Functions {
  //#region STAT-CALCULATING FUNCTIONS /////////////////////////////////////////

  //#region SEQUENCES ----------------------------------------------------------

  static growthRate(sequence) {
    let x = [], y = [], yMin = 0, yMax = 1;
    for (let i = 1; i < sequence['terms'].length; i++) {
      x.push(i);
      y.push(sequence['terms'][i] / (sequence['terms'][i - 1] || 1));
      yMin = Math.min(yMin, y[i - 1]);
      yMax = Math.max(yMax, y[i - 1]);
    }

    return new Plottable(sequence, [1, x.length], [yMin, yMax], x, y);
  }

  static runningSum(sequence) {
    let x = [0], y = [0], yMin = 0, yMax = 0;
    for (let i = 1; i <= sequence['terms'].length; i++) {
      x.push(i);
      y.push(sequence['terms'][i - 1] + y[i - 1]);
      yMin = Math.min(yMin, y[i]);
      yMax = Math.max(yMax, y[i]);
    }

    return new Plottable(sequence, [0, x.length - 1], [yMin, yMax], x, y);
  }

  static sequence(sequence) {
    let x = [], y = sequence['terms'], yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < y.length; i++) {
      x[i] = i + 1;
      yMin = Math.min(yMin, y[i]);
      yMax = Math.max(yMax, y[i]);
    }

    return new Plottable(sequence, [0, x.length], [yMin, yMax], x, y);
  }

  static derivative(sequence) {
    let x = [], y = [], yMin = 100000000, yMax = -100000000;
    for (let i = 1; i < sequence['terms'].length; i++) {
      x.push(i);
      y.push(sequence['terms'][i] - sequence['terms'][i - 1]);
      yMin = Math.min(yMin, y[i - 1]);
      yMax = Math.max(yMax, y[i - 1]);
    }

    return new Plottable(sequence, [1, x.length], [yMin, yMax], x, y);
  }

  static SLOANES_GAP_MIN_NUM = 0;

  static SLOANES_GAP_MAX_NUM = 1e4;

  /** @type {Map<number, number>} */
  static sloanesGapData = null;

  static sloanesGap(sequence) {
    let x = [], y = [], xMin = Infinity, xMax = -Infinity, yMax = -Infinity;
    const toInclude = sequence.hasOwnProperty('terms')
      ? new Set(sequence['terms'])
      : Functions.sloanesGapData.keys();
    for (let num of toInclude) {
      if (num < Functions.SLOANES_GAP_MIN_NUM ||
        num > Functions.SLOANES_GAP_MAX_NUM ||
        !Functions.sloanesGapData.has(num))
        continue;

      const freq = Functions.sloanesGapData.get(num);
      x.push(num);
      y.push(freq);
      xMin = Math.min(xMin, num);
      xMax = Math.max(xMax, num);
      yMax = Math.max(yMax, freq);
    }

    return new Plottable(
      sequence, [xMin - (xMax - xMin) / 50, xMax], [1, yMax], x, y);
  }

  static popularity(sequence) {
    const isInUpperBand = (num, freq) =>
      freq > 597_1968 / Math.pow(num + 36, 1.2916667);

    let x = [0], y = [0], runningUpper = 0, runningTotal;
    const toInclude = sequence.hasOwnProperty('terms')
      ? new Set(sequence['terms'])
      : Functions.sloanesGapData.keys();
    runningTotal = toInclude.size || Functions.sloanesGapData.size;
    for (let num of toInclude) {
      if (num < Functions.SLOANES_GAP_MIN_NUM ||
        num > Functions.SLOANES_GAP_MAX_NUM ||
        !Functions.sloanesGapData.has(num))
        continue;

      const freq = Functions.sloanesGapData.get(num);
      runningUpper += isInUpperBand(num, freq);
      // runningTotal++;
      x.push(x[x.length - 1] + 1);
      y.push(runningUpper / runningTotal);
    }

    return new Plottable(sequence, [0, 1], [0, 1], x, y);
  }

  //#endregion

  //#region NUMBERS ------------------------------------------------------------

  static indexCounts(number) {
    let x = [], y = [];
    for (let index in number['index_counts']) {
      x[+index] = +index + 1;
      y[+index] = number['index_counts'][index];
    }

    let yMax = 0;
    for (let i = 0; i < x.length; i++) {
      if (!y[i]) {
        x[i] = i + 1;
        y[i] = 0;
      } else if (y[i] > yMax) {
        yMax = y[i];
      }
    }

    return new Plottable(number, [0, x.length], [0, yMax], x, y);
  }

  static neighbors(number) {
    let x = [0], y = [number['num']], magnitudes = [0], yMin = Infinity,
        yMax = -Infinity, xMin = Infinity, xMax = -Infinity, magnitudeMax = 0;
    const sortedDistances =
      Object.keys(number.neighbors).sort((x, y) => Math.abs(x) - Math.abs(y));
    for (let distance of sortedDistances) {
      let neighborCounts = number.neighbors[distance];
      for (let neighbor in neighborCounts) {
        if (+distance < xMin) xMin = +distance;
        if (+distance > xMax) xMax = +distance;
        if (+neighbor < yMin) yMin = +neighbor;
        if (+neighbor > yMax) yMax = +neighbor;
        magnitudeMax = Math.max(magnitudeMax, neighborCounts[neighbor]);
        x.push(+distance);
        y.push(+neighbor);
        magnitudes.push(neighborCounts[neighbor]);
      }
    }
    magnitudes[0] = magnitudeMax * 2;

    return new Plottable(
      number, [xMin - 1, xMax + 1], [yMin, yMax], x, y, magnitudes);
  }

  static connections(number) {
    let x = [], y = [], posxMin = Infinity, posxMax = -Infinity,
        negxMin = Infinity, negxMax = -Infinity, yMin = Infinity,
        yMax = -Infinity;

    const NEIGHBOR_COUNT = 6;
    const POS_NEIGHBORS = [2, 3, 4, 5, 6];
    const NEG_NEIGHBORS = [-2, -3, -4, -5, -6];
    const POS_MAPPING = {};
    const NEG_MAPPING = {};

    // each x element is of the form
    //  [
    //    neighbor distance,
    //    index in closest neighbor array (1 or -1),
    //    neighbor value,
    //    neighbor appearance count
    //  ]
    let count = 0;
    let posIntersection = [];
    let negIntersection = [];
    for (let kkey in number.neighbors[1]) {
      let neighbor = +kkey;
      let val = number.neighbors[1][kkey];
      let dataElem = [1, count, neighbor, val];
      POS_MAPPING[neighbor] = count;
      if (val < posxMin) posxMin = val;
      if (val > posxMax) posxMax = val;
      count = count + 1;
      x.push(dataElem);
      posIntersection.push(neighbor);
      y.push(0);
    }
    count = 0;
    for (let kkey in number.neighbors[-1]) {
      let neighbor = +kkey;
      let val = number.neighbors[-1][kkey];
      let dataElem = [-1, count, neighbor, val];
      NEG_MAPPING[neighbor] = count;
      if (val < negxMin) negxMin = val;
      if (val > negxMax) negxMax = val;
      count = count + 1;
      x.push(dataElem);
      negIntersection.push(neighbor);
      y.push(0);
    }

    let currIntersection = [];
    for (let key of POS_NEIGHBORS) {
      let dist = +key;
      /*
      if(dist == 1 || dist == -1) {
        continue;
      }*/
      // else {
      for (let kkey in number.neighbors[key]) {
        let dataElem;
        let neighbor = +kkey;
        let mapping = dist < 0 ? NEG_MAPPING[neighbor] : POS_MAPPING[neighbor];
        let val = number.neighbors[key][kkey];
        if (posIntersection.includes(neighbor)) {
          dataElem = [dist, mapping, neighbor, val];
          x.push(dataElem);
          currIntersection.push(neighbor);
          y.push(0);
        }
      }
      posIntersection = currIntersection;
      currIntersection = [];
      //}
    }

    currIntersection = [];
    for (let key of NEG_NEIGHBORS) {
      let dist = +key;
      /*
      if(dist == 1 || dist == -1) {
        continue;
      }*/
      // else {
      for (let kkey in number.neighbors[key]) {
        let dataElem;
        let neighbor = +kkey;
        let mapping = dist < 0 ? NEG_MAPPING[neighbor] : POS_MAPPING[neighbor];
        let val = number.neighbors[key][kkey];
        if (negIntersection.includes(neighbor)) {
          dataElem = [dist, mapping, neighbor, val];
          x.push(dataElem);
          currIntersection.push(neighbor);
          y.push(0);
        }
      }
      negIntersection = currIntersection;
      currIntersection = [];
      //}
    }

    x.sort(function(a, b) {
      return Math.abs(a[0]) - Math.abs(b[0]);
    });

    return new Plottable(number, [0, 11], [-6, 6], x, y);
  }

  //#endregion

  //#endregion

  //#region PLOTTING FUNCTIONS /////////////////////////////////////////////////

  //#region CONSTANTS ----------------------------------------------------------

  /** The total duration of a transition in milliseconds. */
  static TOTAL_TRANSITION_DURATION = 2083;

  /** The duration of an individual transition in milliseconds. */
  static TRANSITION_DURATION = 347.2;

  //#endregion

  //#region AREA ---------------------------------------------------------------

  static area(elem, data, index, xExtent, yExtent, showInfo, plotMenu) {
    /** @type {Map<number, Map<number, Plottable>>>} */
    let [metadata, settings] = elem.datum();
    const haveSettingsChanged = settings !=
      (plotMenu.isSelectableSelected('plot-scatter-menu-linear')
          ? 'linear'
          : plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider'));

    if (haveSettingsChanged) {
      if (plotMenu.isSelectableSelected('plot-scatter-menu-linear')) {
        settings = 'linear';
      } else {
        settings =
          plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider');
      }
      elem.datum()[1] = settings;
    }

    let wrapper = elem.select('#plot-data-wrapper-' + index);

    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    if (!data && !haveSettingsChanged) {
      // data is null: user deselected, remove elements
      for (let xs of metadata.values()) xs.delete(index);

      wrapper.classed('active', false)
        .style('opacity', 1)
        .transition('fade')
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove();

      return;
    }

    const xScale = d3.scaleLinear().domain(xExtent).range([0, plotWidth]);
    let yScale;
    if (settings == 'linear') {
      yScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]);
    } else {
      yScale = d3.scaleLog()
                 .base(Functions.SCATTER_LOG_BASES[settings][0])
                 .domain([Math.max(yExtent[0], Number.EPSILON), yExtent[1]])
                 .range([plotHeight, 0]);
    }

    const line = d3.area()
                   .x(d => xScale(d[0]))
                   .y(d => (yScale(d[1]) + 1 || plotHeight + 1) - 1)
                   .curve(d3.curveLinear),
          area = d3.area()
                   .x(d => xScale(d[0]))
                   .y0(yScale(Number.EPSILON))
                   .y1(d => (yScale(d[1]) + 1 || plotHeight + 1) - 1)
                   .curve(d3.curveLinear);

    if (haveSettingsChanged) {
      // just updating the axis-scales
      elem.selectAll('.plot-area-path')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('d', area);
      elem.selectAll('.plot-line-path')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('d', line);
      elem.selectAll('.plot-line-node')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => (yScale(d[1]) + 1 || plotHeight + 1) - 1);

      return;
    }

    if (!wrapper.empty() && wrapper.classed('active')) {
      // extent has been changed: move the elements
      wrapper.selectAll('.plot-area-path')
        .transition('move')
        .ease(d3.easeLinear)
        .duration(Functions.TRANSITION_DURATION)
        .attr('d', area);
      wrapper.selectAll('.plot-line-path')
        .transition('move')
        .ease(d3.easeLinear)
        .duration(Functions.TRANSITION_DURATION)
        .attr('d', line);
      wrapper.selectAll('.plot-line-bar-clickable')
        .attr('x', d => xScale(d - 0.5))
        .attr('width', xScale(1) - xScale(0))
        .attr('height', plotHeight);
      wrapper.selectAll('.plot-line-node')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => (yScale(d[1]) + 1 || plotHeight + 1) - 1);

      return;
    }

    // update metadata
    for (let x of data.x) {
      if (!metadata.has(x)) metadata.set(x, new Map());
      metadata.get(x).set(index, data);
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index)}, 0.25)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g')
                .attr('class', 'plot-data-elem active')
                .attr('id', 'plot-data-wrapper-' + index);

    const unrolledData = data.x.map((x, i) => [x, data.y[i]]),
          clipPathId = Math.floor(Math.random() * (1 << 31));
    wrapper.append('path')
      .datum(unrolledData)
      .attr('class', 'plot-area-path')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('fill', fillColor)
      .style('stroke', 'none')
      .style('stroke-width', '2px')
      .style('z-order', '1728')
      .attr('d', area)
      .attr('clip-path', `url(#plot-line-clip-path-${clipPathId})`);
    wrapper.append('path')
      .datum(unrolledData)
      .attr('class', 'plot-line-path')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('fill', 'none')
      .style('stroke', strokeColor)
      .style('stroke-width', '2px')
      .style('z-order', '1728')
      .attr('d', line)
      .attr('clip-path', `url(#plot-line-clip-path-${clipPathId})`);
    wrapper.append('clipPath')
      .attr('id', 'plot-line-clip-path-' + clipPathId)
      .append('rect')
      .attr('width', '0%')
      .attr('height', '100%')
      .transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TOTAL_TRANSITION_DURATION)
      .attr('width', '100%');

    // assuming that the data is continuous i.e. d[i+1] = d[i]+1
    wrapper.selectAll('.plot-line-node')
      .data(unrolledData)
      .join('circle')
      .attr('class', 'plot-line-node')
      .attr('id', (_d, i) => 'plot-line-node-' + i)
      .style('fill', strokeColor)
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => (yScale(d[1]) + 1 || plotHeight + 1) - 1)
      .attr('r', 0);
    let clickables =
      wrapper.selectAll('.plot-line-bar-clickable')
        .data(data.x)
        .join('rect')
        .attr('class', 'plot-line-bar-clickable')
        .attr('id', (_d, i) => 'plot-line-bar-clickable-' + i)
        .style('opacity', 0)
        .attr('x', d => xScale(d - 0.5))
        .attr('y', 0)
        .attr('width', xScale(1) - xScale(0))
        .attr('height', plotHeight)
        .style('display', 'none')
        .on('mouseenter',
          e => {
            let target = d3.select(e.currentTarget);
            const i =
              +target.attr('id').substr('plot-line-bar-clickable-'.length);

            let node = elem.selectAll('#plot-line-node-' + i);
            node.attr('r', Functions.LINE_NODE_RADIUS);
            let info =
              Array.from(metadata.get(data.x[i])).map(x => x.concat(i));
            if (showInfo(info)) InfoPanel.show(node);
          })
        .on('mouseleave', e => {
          InfoPanel.hide();

          const i = +d3.select(e.currentTarget)
                       .attr('id')
                       .substr('plot-line-bar-clickable-'.length);
          elem.selectAll('#plot-line-node-' + i).attr('r', 0);
        });

    clickables.transition()
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .style('display', '');
  }

  static areaAxes(elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu) {
    Functions.scatterAxes(
      elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu, Functions.area);
  }

  //#endregion

  //#region BAR ----------------------------------------------------------------

  static BAR_MARGIN = 0.25;

  static bar(elem, data, index, xExtent, yExtent, showInfo) {
    /** @type {Map<number, Map<number, Plottable>>>} */
    let metadata = elem.datum();
    if (!metadata) elem.datum(metadata = new Map());

    let wrapper = elem.select('#plot-data-wrapper-' + index);

    let yScaleExtent;
    let drawFrom;
    if (Math.abs(yExtent[0] + yExtent[1]) < 1e-10) {
      drawFrom = '50';
      yScaleExtent = yExtent;
    } else {
      drawFrom = '100';
      yScaleExtent = data?.yExtent;
    }

    if (!data) {  // data is null: user deselected, remove elements
      for (let xs of metadata.values()) xs.delete(index);

      wrapper.classed('active', false)
        .selectAll('.plot-bar-bar-clickable')
        .remove();
      wrapper.selectAll('.plot-bar-bar')
        .transition('fade')
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .attr('y', drawFrom + '%')
        .attr('height', '0%')
        .on('end', () => wrapper.remove());

      return;
    }

    const xScale = d3.scaleLinear().domain(xExtent).range([0, 100]),
          yScale = d3.scaleLinear().domain(yScaleExtent).range([0, 100]),
          fullWidth = 100 / (xExtent[1] - xExtent[0] + 1),
          width =
            (1 - Functions.BAR_MARGIN) * (100 / (xExtent[1] - xExtent[0] + 1));

    if (!wrapper.empty() && wrapper.classed('active')) {
      // extent has been changed: move the elements
      wrapper.selectAll('.plot-bar-bar-clickable')
        .attr('x', d => xScale(d) - fullWidth / 2 + '%')
        .attr('y', '100%')
        .attr('width', fullWidth + '%')
        .attr('height', '100%');
      wrapper.selectAll('.plot-bar-bar')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('x', (_d, i) => (xScale(data.x[i]) - width / 2) + '%')
        .attr('y',
          (d, i) => (data.y[i] < 0 ? drawFrom : 100 - yScale(data.y[i])) + '%')
        .attr('height',
          (_d, i) => Math.abs(yScale(data.y[i]) - (100 - drawFrom)) + '%')
        .attr('width', width + '%');

      return;
    }

    // update metadata
    for (let x of data.x) {
      if (!metadata.has(x)) metadata.set(x, new Map());
      metadata.get(x).set(index, data);
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index)}, 0.3333)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g')
                .attr('class', 'plot-data-elem active')
                .attr('id', 'plot-data-wrapper-' + index);

    wrapper.selectAll('.plot-bar-bar')
      .data(data.x)
      .join('rect')
      .attr('class', 'plot-bar-bar')
      .attr('id', (_d, i) => 'plot-bar-bar-' + i)
      .attr('x', d => xScale(d) - width / 2 + '%')
      .attr('y', drawFrom + '%')
      .attr('height', '0%')
      .attr('width', width + '%')
      .style('fill', fillColor)
      .style('stroke', strokeColor)
      .style('stroke-width', '1px')
      .style('z-order', '1728')
      .transition('fade')
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .ease(d3.easeElasticOut)
      .duration(Functions.TRANSITION_DURATION * 2)
      .attr('y',
        (d, i) => (data.y[i] < 0 ? drawFrom : 100 - yScale(data.y[i])) + '%')
      .attr('height',
        (_d, i) => Math.abs(yScale(data.y[i]) - (100 - drawFrom)) + '%');

    // draw clickable areas
    let clickables =
      wrapper.selectAll('.plot-bar-bar-clickable')
        .data(data.x)
        .join('rect')
        .attr('class', 'plot-bar-bar-clickable')
        .attr('id', (_d, i) => 'plot-bar-bar-clickable-' + i)
        .style('opacity', 0)
        .attr('x', d => xScale(d) - fullWidth / 2 + '%')
        .attr('y', '0%')
        .attr('width', fullWidth + '%')
        .attr('height', '100%')
        .style('display', 'none')
        .on('mouseenter',
          e => {
            let target = d3.select(e.currentTarget);
            const i =
              +target.attr('id').substr('plot-bar-bar-clickable-'.length);

            let info =
              Array.from(metadata.get(data.x[i])).map(x => x.concat(i));
            if (showInfo(info)) {
              let tallest = null, tallestHeight = -1;
              elem.selectAll('#plot-bar-bar-' + i).each((_d, i, a) => {
                let curr = d3.select(a[i]),
                    currHeight = +curr.attr('height').slice(0, -1);
                if (currHeight > tallestHeight) {
                  tallestHeight = currHeight;
                  tallest = curr;
                }
              });
              InfoPanel.show(tallest);
            }
          })
        .on('mouseleave', () => InfoPanel.hide());

    clickables.transition()
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .style('display', '');
  }

  static derivativeBar(elem, data, index, xExtent, yExtent, showInfo) {
    let yExtentAbsMax = Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1]));
    let balancedYExtent = [-yExtentAbsMax, yExtentAbsMax];

    Functions.bar(elem, data, index, xExtent, balancedYExtent, showInfo)
  }

  static barAxes(elem, title, xLabel, yLabel, xExtent, yExtent, _plotMenu) {
    // this function is called any time whenever there is a need to redraw the
    // axes
    const plotWidth = elem.property('clientWidth'),
          plotHeight = elem.property('clientHeight');

    // create scale for axis
    const xAxisScale = d3.scaleLinear().domain(xExtent).range([0, plotWidth]),
          xAxis = d3.axisBottom().scale(xAxisScale).ticks(5);

    // plot axes
    let isLinear = true;
    let yAxisScale;
    if (isLinear) {
      yAxisScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]);
    } else {
      yAxisScale =
        d3.scaleLog()
          .base(Functions.SCATTER_LOG_BASES[plotMenu.getSteppedSliderCurrStep(
            'plot-scatter-menu-log-slider')][0])
          .domain([
            Math.max(
              yExtent[0], plotData == Functions.scatter ? 1 : Number.EPSILON),
            yExtent[1]
          ])
          .range([plotHeight, 0]);
    }

    let yAxis = d3.axisLeft().scale(yAxisScale).ticks(5);
    // if (!isLinear)
    //  yAxis = yAxis.ticks(3).tickFormat(x => d3.format('')(+x.toFixed(2)));

    elem.select('#plot-x-axis')
      .transition('move')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .call(xAxis);
    elem.select('#plot-y-axis')
      .classed('text-only-axis', false)
      .transition('move')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .call(yAxis);

    // show axis and title labels
    let tf = `translate(${plotWidth / 2}, ${plotHeight + 32})`;
    elem.select('#plot-x-label-text').attr('transform', tf).text(xLabel);

    const tickWidth = 6 *
      Math.max(...yExtent.map(
        x => (isLinear ? d3.format(',.2r')(x) : d3.format(',.2r')(x))
               .toString()
               .length));
    tf = `translate(${- 12 - tickWidth}, ${plotHeight / 2})`;
    let yLabelElem = elem.select('#plot-y-label-text');
    yLabelElem.text(yLabel);
    yLabelElem.transition('move')
      .ease(d3.easeSinOut)
      .duration(yLabelElem.attr('transform').includes('translate')
          ? Functions.TRANSITION_DURATION
          : 0)  // no transition for initial display to avoid being nifty
      .attr('transform', tf + ' rotate(-90)');

    tf = `translate(${plotWidth / 2}, -20)`;
    elem.select('#plot-title-text').attr('transform', tf).text(title);
  }

  static barAxesIndexCounts(
    elem, title, xLabel, _yLabel, xExtent, _yExtent, _plotMenu) {
    // create bar axes
    Functions.barAxes(
      elem, title, xLabel, _yLabel, xExtent, _yExtent, _plotMenu)

    // clear y-axis elements
    elem.select('#plot-y-axis').html('');
    elem.select('#plot-y-label-text').html('');
  }

  //#endregion

  //#region BAR (popularity) ---------------------------------------------------

  static BAR_POPULARITY_BAR_PADDING = 6.25;

  static BAR_POPULARITY_TRANSITION_MAX_NUM_STEPS = 144;

  static barPopularity(elem, data, index, xExtent, _yExtent, showInfo) {
    let wrapper = elem.select('#plot-data-wrapper-0');
    /** @type {Map<number, Plottable>} */
    let metadata = wrapper.datum();
    if (data)
      metadata.set(index, data);
    else
      metadata.delete(index);

    let bars = wrapper.selectAll('.plot-bar-pop-bar.active')
                 .data(
                   // data: [seqID, popularity[]]
                   Array.from(metadata.entries()).sort((x, y) => y[0] - x[0]),
                   // key: seqID
                   d => d[0]);
    let exitedBars = bars.exit();
    exitedBars.classed('active', false)
      .transition()
      .ease(d3.easeSinIn)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', (_d, i, a) => 100 / a.length * (i + 0.5) + '%')
      .attr('y', '50%')
      .attr('width', '0%')
      .attr('height', '0%')
      .remove();
    exitedBars.selectAll('text')
      .transition()
      .ease(d3.easeSinIn)
      .duration(Functions.TRANSITION_DURATION / 2)
      .style('opacity', 0);
    const existingBarsEase = data ? d3.easeSinOut : d3.easeSinInOut;
    bars.transition('move')
      .delay(data ? 0 : Functions.TRANSITION_DURATION / 2)
      .ease(existingBarsEase)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', (_d, i, a) => 100 / a.length * i + '%')
      .attr('width', (_d, _i, a) => 100 / a.length + '%');
    const fontSize = (d, m) =>
      Math.min(d[1] * 96, 36 / Math.max(m.size - 1, 1) * 1.5);
    bars.selectAll('.plot-bar-pop-bar-label')
      .transition('move-font')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .style('font-size', d => fontSize(d, metadata) + 'px')
      .style(
        'transform', d => `translate(0px, ${fontSize(d, metadata) / 4}px)`);

    let enteredBars =
      bars.enter()
        .append('svg')
        .attr('class', 'plot-bar-pop-bar active')
        .attr('x', (_d, i, a) => 100 / a.length * (i + 0.5) + '%')
        .attr('y', '50%')
        .attr('width', '0%')
        .attr('height', '0%')
        .on('mouseenter',
          e => {
            let target = d3.select(e.currentTarget);

            const color = `hsl(${Util.generateColor(index, 0.5)})`;
            InfoPanel.header(d3.format('.1%')(data.y[data.length - 1]))
            if (index == -1) {
              InfoPanel.text('of all numbers');
            }
            else {
              InfoPanel.text('of the numbers in ')
                .text(data.rawData['a_num'], color, true);
            }
            InfoPanel.text(' are in the "Upper Band" or are "popular"')
              .newline()
              .newline()
              .text(
                d3.format('.1%')(1 - data.y[data.length - 1]), 'black', true)
            if (index == -1) {
              InfoPanel.text(' of all numbers');
            }
            else {
              InfoPanel.text(' of the numbers in ')
                .text(data.rawData['a_num'], color, true);
            }
            InfoPanel.text(' are in the "Lower Band" or are "unpopular"')
              .show(target);
          })
        .on('mouseleave', () => InfoPanel.hide());
    enteredBars.transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', (_d, i, a) => 100 / a.length * i + '%')
      .attr('y', '0%')
      .attr('width', (_d, _i, a) => 100 / a.length + '%')
      .attr('height', '100%');
    if (data) {
      enteredBars.append('text')
        .attr('x', '50%')
        .attr('y', '108%')
        .style('text-anchor', 'middle')
        .style('fill', 'black')
        .style('font-size', 'x-small')
        .style('opacity', 0)
        .text(data.rawData['a_num'] || 'All Integers')
        .transition()
        .delay(Functions.TRANSITION_DURATION)
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .style('opacity', 1);
    }
    const padding = Functions.BAR_POPULARITY_BAR_PADDING;
    enteredBars.append('rect')
      .datum(d => [d[0], d[1].y[d[1].length - 1]])
      .attr('id', 'plot-bar-pop-bar-bottom')
      .style('fill',
        d => d[0] == -1 ? 'var(--gray-a-25)'
                        : `hsla(${Util.generateColor(d[0], 0.5, 0.5)}, 0.25`)
      .attr('x', padding + '%')
      .attr('y', '0%')
      .attr('width', (100 - padding * 2) + '%')
      .attr('height', '100%');
    let topRect =
      enteredBars.append('rect')
        .datum(d => [d[0], d[1].y[d[1].length - 1]])
        .attr('id', 'plot-bar-pop-bar-top')
        .style('fill',
          d => d[0] == -1 ? 'var(--gray-a-42)'
                          : `hsla(${Util.generateColor(d[0], 0.75)}, 0.3333`)
        .attr('x', padding + '%')
        .attr('y', '0%')
        .attr('width', (100 - padding * 2) + '%')
        .attr('height', '0%');
    let topText = enteredBars.append('text')
                    .attr('class', 'plot-bar-pop-bar-label')
                    .datum(d => [d[0], d[1].y[d[1].length - 1]])
                    .style('fill', 'white')
                    .style('text-anchor', 'middle')
                    .style('user-select', 'none')
                    .style('opacity', 0.3333)
                    .attr('x', '50%')
                    .attr('y', '0%')
                    .text('0%');
    let bottomText = enteredBars.append('text')
                       .attr('class', 'plot-bar-pop-bar-label')
                       .datum(d => [d[0], 1 - d[1].y[d[1].length - 1]])
                       .style('fill', 'black')
                       .style('text-anchor', 'middle')
                       .style('user-select', 'none')
                       .style('opacity', 0.1667)
                       .attr('x', '50%')
                       .attr('y', '0%')
                       .text('0%');

    if (!data) return;

    const step = Math.max(
      data.length / Functions.BAR_POPULARITY_TRANSITION_MAX_NUM_STEPS, 1);
    for (let i = 0; i < data.length + step; i += step) {
      const j = Math.min(Math.round(i), data.length - 1), x = data.x[j],
            y = data.y[j],
            delay =
              Functions.TOTAL_TRANSITION_DURATION / (data.length || 1) * j;
      topRect.transition('move-' + j)
        .delay(delay)
        .ease(d3.easeCircleOut)
        .duration(Functions.TRANSITION_DURATION / 2)
        .attr('height', y * 100 + '%');
      topText.transition('move-' + j)
        .delay(delay)
        .ease(d3.easeCircleOut)
        .duration(Functions.TRANSITION_DURATION / 2)
        .attr('y', y * 50 + '%')
        .text(Math.floor(y * 100) + '%');
      bottomText.transition('move-' + j)
        .delay(delay)
        .ease(d3.easeCircleOut)
        .duration(Functions.TRANSITION_DURATION / 2)
        .attr('y', y * 100 + (100 - y * 100) / 2 + '%')
        .text(Math.ceil((1 - y) * 100) + '%');

      let fontSize =
        Math.min(y * 96, 36 / Math.max(metadata.size - 1, 1) * 1.5);
      topText.transition('move-font')
        .delay(delay)
        .ease(d3.easeCircleOut)
        .style('font-size', fontSize + 'px')
        .style('transform', `translate(0px, ${fontSize / 4}px)`);

      fontSize =
        Math.min((1 - y) * 96, 36 / Math.max(metadata.size - 1, 1) * 1.5);
      bottomText.transition('move-font')
        .delay(delay)
        .ease(d3.easeCircleOut)
        .style('font-size', fontSize + 'px')
        .style('transform', `translate(0px, ${fontSize / 4}px)`);
    }
  }

  static barAxesPopularity(elem, title) {
    if (!elem.datum()) {
      elem.datum(new Map())
        .append('svg')
        .attr('class', 'plot-data-elem active')
        .attr('id', 'plot-data-wrapper-0');
    }

    const plotWidth = elem.property('clientWidth');

    const tf = `translate(${plotWidth / 2}, -20)`;
    elem.select('#plot-title-text').attr('transform', tf).text(title);
  }

  //#endregion

  //#region GRID ---------------------------------------------------------------

  static GRID_BASES = d3.range(2, 17);  // [2..16]

  /** The default base to use in the grid plot. */
  static GRID_DEFAULT_BASE = 10;

  /** The number of columns in the grid plot. */
  static GRID_NUM_COLS = 60;

  /**
   * The maximum number of empty columns kept in the grid before it collapses
   * and injects an ellipsis.
   */
  static GRID_MAX_EMPTY_COLS = 2;

  /** The number of columns each instance of ellipses should take up. */
  static GRID_ELLIPSIS_COLS = 2;

  /** The number of dots each instance of ellipses should have. */
  static GRID_NUM_ELLIPSIS_DOTS = 3;

  /**
   * The fraction of the length of a cell in the grid plot to leave as the
   * space between cells.
   */
  static GRID_CELL_MARGIN_FACTOR = 0.0625;

  /**
   * @param {Selection} elem
   * @param {Plottable} data
   * @param {number} index
   * @param {[number, number]} _xExtent
   * @param {[number, number]} _yExtent
   * @param {function} _showInfo
   * @param {PlotMenu} plotMenu
   */
  static grid(elem, data, index, _xExtent, _yExtent, _showInfo, plotMenu) {
    //#region DATA PROCESSING

    let wrapper = elem.select('#plot-data-wrapper-0');
    // use `wrapper.datum()` to store the plot's metadata
    /**
     * @type {[number, Map<number, number[]>, Map<number, string>, Map<number,
     *   Map<number, number[]>>]}
     */
    let [base, sequences, sequenceData, cells] = wrapper.datum();

    // update the cells
    if (!data) {
      if (index >= 0) {
        // handle deselection: delete this index from plotted numbers
        for (let num of sequences.get(index)) {
          if (!cells.has(num)) continue;
          if (cells.get(num).delete(index) && !cells.get(num).size)
            cells.delete(num);
        }
        sequences.delete(index);
        sequenceData.delete(index);
      } else {
        // index of -1 indicates a base change (by the menu)
        base = Functions.GRID_BASES[plotMenu.getSteppedSliderCurrStep(
          'plot-grid-base-slider')];
        wrapper.datum()[0] = base;
      }
    } else {
      // handle movement: nothing to handle for this particular vis
      if (sequences.has(index)) return;

      // handle new selection: add this index to plotted numbers; numbers in the
      // sequences are given as the Y-values
      sequences.set(index, data.y);
      sequenceData.set(index, data.rawData);
      for (let i = 0; i < data.y.length; i++) {
        let num = data.y[i];
        if (!cells.has(num)) cells.set(num, new Map());
        if (cells.get(num).has(index))
          cells.get(num).get(index).push(i);
        else
          cells.get(num).set(index, [i]);
      }
    }

    // process cells: filter cells that fit into the display area and create
    // cell data array to feed into `d3.data()`
    //
    // let each element in the processed data be the selection info of the
    // incident number, and let `null` represent a cell in an empty column which
    // should not be displayed
    const numCols = Functions.GRID_NUM_COLS, numCells = base * numCols;

    let nums = Array.from(cells.keys()).sort((x, y) => x - y), zeroIndex;
    if (!nums.length || nums[0] >= 0)
      zeroIndex = 0;
    else if (nums[nums.length - 1] < 0)
      zeroIndex = nums.length;
    else
      zeroIndex = nums.findIndex(x => x >= 0);

    // fake a linked list by setting zero at the middle
    /** @type {[number, Map<number, number[]]>[]} */
    let buffer = new Array(2 * numCells);

    // process positive numbers first, then negative numbers: for each number,
    // determine (1) whether it'd into the grid and (2) how many empty columns
    // it'd leave and whether that'd trigger ellipses
    let currCol = 0, prevCol = 0;
    for (let i = zeroIndex; i < nums.length; i++) {
      currCol = Math.floor(nums[i] / base);
      if (currCol > prevCol + Functions.GRID_MAX_EMPTY_COLS + 1) {
        currCol = prevCol + Functions.GRID_ELLIPSIS_COLS + 1;
        if (currCol >= numCols) break;
        for (let j = 1; j <= Functions.GRID_ELLIPSIS_COLS; j++)
          for (let k = 0; k < base; k++)
            buffer[(numCols + prevCol + j) * base + k] = null;
      }
      prevCol = currCol;

      const cellIndex = numCells + currCol * base + nums[i] % base;
      buffer[cellIndex] = [nums[i], cells.get(nums[i])];
    }
    currCol = -1, prevCol = -1;
    for (let i = zeroIndex - 1; i >= 0; i--) {
      currCol = Math.floor(nums[i] / base);
      if (currCol < prevCol - Functions.GRID_MAX_EMPTY_COLS - 1) {
        currCol = prevCol - Functions.GRID_ELLIPSIS_COLS - 1;
        if (currCol < -numCols) break;
        for (let j = 1; j <= Functions.GRID_ELLIPSIS_COLS; j++)
          for (let k = 0; k < base; k++)
            buffer[(numCols + prevCol - j) * base + k] = null;
      }
      prevCol = currCol;

      const cellIndex =
        numCells + currCol * base + (nums[i] % base + base) % base;
      buffer[cellIndex] = [nums[i], cells.get(nums[i])];
    }

    // construct cell data: find the start and end position (the "range"
    // of relevant data in the buffer) and slice the buffer as final cell data
    // accordingly
    let start = numCols, end = numCols;
    for (let i = 2 * numCols - 1; i >= numCols && end == numCols; i--) {
      for (let j = 0; j < base; j++) {
        if (buffer[i * base + j]) {
          end = i + 1;
          break;
        }
      }
    }
    for (let i = 0; i < numCols && start == numCols; i++) {
      for (let j = 0; j < base; j++) {
        if (buffer[i * base + j]) {
          start = i;
          break;
        }
      }
    }
    let cellData;
    if (start < numCols / 2) {
      end = Math.min(end, Math.floor(numCells * 1.5));
      cellData = buffer.slice(end * base - numCells, end * base);
    } else {
      cellData = buffer.slice(start * base, start * base + numCells);
    }

    //#endregion

    //#region PLOTTING

    // "contents" refer to the wrapper of rectangles: one wrapper per sequence-
    // selection; multiple occurrences of the same number within the same
    // sequence would be handled by having stacked rects with the same color
    const isHist = plotMenu.isSelectableSelected('plot-grid-bar');
    let contents =
      Functions.gridCells(wrapper, base, cellData, sequenceData, plotMenu)
        .selectAll('.plot-grid-cell-contents.active')
        .data(
          /**
           * @param {[number, Map<number, number[]>]} d
           * [number, Map<sequenceIndex, occurrences[]>]
           */
          // data: [seqIndex, selectionIndex, totalSelections, occurrences[],
          // runningOccurrences, totalOccurrences]
          d => {
            if (!d) return [];

            let totalOccurrences = 0;
            for (let occurrences of d[1].values())
              totalOccurrences += occurrences.length;

            let selections = Array.from(d[1]).sort((x, y) => x[0] - y[0]),
                contentsData = [], runningOccurrences = 0;
            for (let i = 0; i < selections.length; i++) {
              contentsData.push([
                selections[i][0], i, selections.length, selections[i][1],
                runningOccurrences, totalOccurrences
              ]);
              runningOccurrences += selections[i][1].length;
            }

            return contentsData;
          },
          // key: sequenceIndex
          d => d[0]);
    contents.exit()
      .classed('active', false)
      .transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', d => 100 * (isHist ? d[4] / d[5] : (d[1] + 0.5) / d[2]) + '%')
      .attr('y', !isHist * 50 + '%')
      .attr('width', '0%')
      .attr('height', isHist * 100 + '%')
      .remove();
    contents.transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', d => 100 * (isHist ? d[4] / d[5] : d[1] / d[2]) + '%')
      .attr('width', d => 100 * (isHist ? d[3].length / d[5] : 1 / d[2]) + '%');
    contents =
      contents.enter()
        .append('svg')
        .attr('class', 'plot-grid-cell-contents active')
        .attr('x', d => 100 * (isHist ? d[4] / d[5] : d[1] / d[2]) + '%')
        .attr('y', '0%')
        .attr(
          'width', d => 100 * (isHist ? d[3].length / d[5] : 1 / d[2]) + '%')
        .attr('height', '100%')
        .merge(contents);

    let rects = contents.selectAll('rect').data(
      /**
       * @param {[number, number, number, number[], number]} d
       * [seqIndex, selectionIndex, totalSelections, occurrences[]]
       */
      // data: [sequenceIndex, occurrence]
      d => d[3].map(x => [d[0], x]),
      // key: occurrence
      d => d[1]);
    rects.exit().remove();
    rects.transition('move')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .style('fill',
        d => `hsla(${Util.generateColor(d[0])}, ${isHist ? 0.4167 : 0.3333})`)
      .attr('x', (_d, i, a) => (isHist ? 100 * i / a.length : 0) + '%')
      .attr('width', (_d, i, a) => (isHist ? 100 / a.length : 100) + '%');
    let enteredRects =
      rects.enter()
        .append('rect')
        .style('fill',
          d => `hsla(${Util.generateColor(d[0])}, ${isHist ? 0.4167 : 0.3333})`)
        .attr('x',
          (d, i, a) =>
            (isHist ? 100 * (i + (d[0] == index) * 0.5) / a.length : 50) + '%')
        .attr('y', d => (!isHist || d[0] == index) * 50 + '%')
        .attr('width', '0%')
        .attr('height', d => (isHist && d[0] != index) * 100 + '%');
    enteredRects
      .filter(d => d[0] == index)  // new selections
      .transition('fade')
      .delay(d => Functions.TOTAL_TRANSITION_DURATION * d[1] /
          (sequences.get(d[0]).length || 1))
      .ease(d3.easeElasticOut)
      .duration(Functions.TRANSITION_DURATION * 2)
      .attr('x', (_d, i, a) => (isHist ? 100 * i / a.length : 0) + '%')
      .attr('y', '0%')
      .attr('width', (_d, i, a) => (isHist ? 100 / a.length : 100) + '%')
      .attr('height', '100%');
    enteredRects.filter(d => d[0] != index)
      .transition('fade')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', (_d, i, a) => (isHist ? 100 * i / a.length : 0) + '%')
      .attr('y', '0%')
      .attr('width', (_d, i, a) => (isHist ? 100 / a.length : 100) + '%')
      .attr('height', '100%');

    //#endregion
  }

  /** @param {PlotMenu} plotMenu */
  static gridAxes(elem, title, _xLabel, yLabel, _xExtent, _yExtent, plotMenu) {
    // create menu if necessary
    if (!plotMenu.hasClasses('plot-setting')) {
      const update = () => {
        Functions.grid(elem, null, -1, null, null, null, plotMenu);
        Functions.gridAxes(elem, title, null, yLabel, null, null, plotMenu);
      }, selectGrid = () => {
        plotMenu.deselectSelectable('plot-grid-bar')
          .selectSelectable('plot-grid-grid')
          .hideClasses('plot-grid-sort')
          .hide();
        update();
      }, selectBar = () => {
        plotMenu.deselectSelectable('plot-grid-grid')
          .selectSelectable('plot-grid-bar')
          .showClasses('plot-grid-sort')
          .hide();
        update();
      }, changeBase = (i, b) => {
        plotMenu.setText(
          'plot-grid-base-label', 'Modulo Base: ' + Functions.GRID_BASES[i]);
        if (b) update();
      };

      const base = Functions.GRID_DEFAULT_BASE, bases = Functions.GRID_BASES;
      plotMenu
        .appendSelectable(
          'Num-Grid', 'plot-grid-grid', (_d, b) => !b && selectGrid())
        .selectSelectable('plot-grid-grid')
        .appendSelectable(
          'Histogram', 'plot-grid-bar', (_d, b) => !b && selectBar())
        .appendDivider('plot-grid-base-divider')
        .appendLabel('Modulo Base: ' + base, 'plot-grid-base-label')
        .appendSteppedSlider(bases, base - bases[0], 'plot-grid-base-slider',
          (_d, i, _a, b) => changeBase(i, b));
    }

    // draw background (all the empty cells, if needed)
    let wrapper = elem.select('#plot-data-wrapper-0'), base;
    if (wrapper.empty()) {
      base = Functions.GRID_DEFAULT_BASE;
      wrapper = elem.append('g')
                  .attr('class', 'plot-data-elem')
                  .attr('id', 'plot-data-wrapper-0')
                  // create metadata:
                  // [base, sequences, sequenceData, cells]
                  .datum([base, new Map(), new Map(), new Map()]);

      Functions.gridCells(wrapper, base,
        new Array(base * Functions.GRID_NUM_COLS), null, plotMenu);
    } else {
      base = wrapper.datum()[0];
    }

    // draw labels
    const plotWidth = elem.property('clientWidth'),
          plotHeight = elem.property('clientHeight');
    let tf = `translate(${plotWidth / 2}, -20)`;
    elem.select('#plot-title-text')
      .attr('transform', tf)
      .text(title.split('{base}').join(base));

    tf = `translate(-30, ${plotHeight / 2})`;
    elem.select('#plot-y-label-text')
      .text(yLabel)
      .attr('transform', tf + ' rotate(-90)');
  }

  /**
   * @private Creates the cell elements and the backgrounds for the non-empty
   *   cells.
   * @param {Selection} wrapper
   * @param {number} base
   * @param {[number, Map<number, number[]>][]} data
   * @param {Map<number, string>} sequenceData
   * @param {PlotMenu} plotMenu
   */
  static gridCells(wrapper, base, data, sequenceData, plotMenu) {
    // create scales and calculate cell dimensions
    const isHist = plotMenu.isSelectableSelected('plot-grid-bar'),
          numCols = Functions.GRID_NUM_COLS;
    let xScale, counts, runningCounts, totalCount;
    if (isHist) {
      counts = [];
      runningCounts = new Array(base).fill(0);
      totalCount = 0;
      let max = 0;
      for (let col = 0; col < numCols; col++) {
        for (let i = 0; i < base; i++) {
          let count = 0;
          if (data[col * base + i])
            for (let occurrences of data[col * base + i][1].values())
              count += occurrences.length;
          counts[col * base + i] = count;
          totalCount += count;
          if (col) count += runningCounts[(col - 1) * base + i];
          runningCounts[col * base + i] = count;
          if (col == numCols - 1) max = Math.max(max, count);
        }
      }
      xScale =
        d3.scaleLinear().domain([0, Math.max(max, numCols)]).range([0, 100]);
    } else {
      xScale = d3.scaleLinear().domain([0, numCols]).range([0, 100]);
    }
    const yScale = d3.scaleLinear().domain([0, base]).range([100, 0]),
          yMargin = Functions.GRID_CELL_MARGIN_FACTOR,
          xMargin = isHist ? 0 : yMargin,
          cellWidth = (xScale(1) - xScale(0)) * (1 - 2 * xMargin),
          cellHeight = (yScale(0) - yScale(1)) * (1 - 2 * yMargin),
          cellXOffset = (xScale(1) - xScale(0)) * xMargin,
          cellYOffset = (yScale(0) - yScale(1)) * yMargin;

    // create cell elements
    let cells = wrapper.selectAll('.plot-grid-cell.active').data(data);
    let exitedCells = cells.exit();
    exitedCells.classed('active', false)
      .selectAll('rect')
      .transition()
      .ease(d3.easeSinIn)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', '50%')
      .attr('y', '50%')
      .attr('width', '0%')
      .attr('height', '0%')
      .on('end', () => exitedCells.remove());

    let enteredCells =
      cells.enter()
        .append('svg')
        .attr('class', 'plot-grid-cell active')
        .attr('id', (_d, i) => 'plot-grid-cell-' + i)
        .attr('x',
          (_d, i) => xScale(isHist ? runningCounts[i] - counts[i]
                                   : Math.floor(i / base)) +
            cellXOffset + '%')
        .attr('y', (_d, i) => yScale(i % base + 1) + cellYOffset + '%')
        .attr('width',
          (_d, i) => (isHist ? cellWidth * counts[i] : cellWidth) + '%')
        .attr('height', cellHeight + '%');
    cells.transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x',
        (_d, i) =>
          xScale(isHist ? runningCounts[i] - counts[i] : Math.floor(i / base)) +
          cellXOffset + '%')
      .attr('y', (_d, i) => yScale(i % base + 1) + cellYOffset + '%')
      .attr(
        'width', (_d, i) => (isHist ? cellWidth * counts[i] : cellWidth) + '%')
      .attr('height', cellHeight + '%');
    cells = enteredCells.merge(cells);

    // draw cells' "clickable areas" (which ignore the margin)
    const invXMargin = xMargin / (1 - 2 * xMargin),
          invYMargin = yMargin / (1 - 2 * yMargin);
    cells.selectAll('.plot-grid-cell-clickable')
      .data([true])
      .join('rect')
      .attr('class', 'plot-grid-cell-clickable')
      .style('opacity', 0)
      .attr('x', -invXMargin * 100 + '%')
      .attr('y', -invYMargin * 100 + '%')
      .attr('width', 100 + 200 * invXMargin + '%')
      .attr('height', 100 + 200 * invYMargin + '%');

    // draw cell backgrounds
    let backgrounds = cells.selectAll('.plot-grid-cell-background.active')
                        .data(d => new Array(+(!isHist && d !== null)));
    // d: null=hidden, undefined=shown without contents
    backgrounds.exit()
      .classed('active', false)
      .transition()
      .ease(d3.easeSinIn)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', '50%')
      .attr('y', '50%')
      .attr('width', '0%')
      .attr('height', '0%')
      .remove();
    backgrounds.enter()
      .append('rect')
      .attr('class', 'plot-grid-cell-background active')
      .attr('x', '50%')
      .attr('y', '50%')
      .attr('width', '0%')
      .attr('height', '0%')
      .transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', '0%')
      .attr('y', '0%')
      .attr('width', '100%')
      .attr('height', '100%');

    // draw ellipses
    const numDots = Functions.GRID_NUM_ELLIPSIS_DOTS,
          dotSpan = Functions.GRID_ELLIPSIS_COLS;
    let ellipsisData = [];
    if (!isHist) {
      for (let i = 0; i < Functions.GRID_NUM_COLS; i++) {
        if (data[i * base] === null) {
          for (let j = 1; j <= numDots; j++)
            ellipsisData.push(i * (numDots + 1) / dotSpan + j);
          i += dotSpan - 1;
        }
      }
    }
    let ellipses = wrapper.selectAll('.plot-grid-ellipsis-dot.active')
                     .data(ellipsisData, d => d);
    ellipses.exit()
      .classed('active', false)
      .transition()
      .ease(d3.easeSinIn)
      .duration(Functions.TRANSITION_DURATION)
      .attr('r', '0%')
      .remove();
    ellipses.enter()
      .append('circle')
      .attr('class', 'plot-grid-ellipsis-dot active')
      .attr('cx', d => xScale(d * dotSpan / (numDots + 1)) + '%')
      .attr('cy', '50%')
      .attr('r', '0%')
      .transition()
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .attr('r', Functions.GRID_CELL_MARGIN_FACTOR * cellWidth * 4 + '%');

    // create axis-ticks
    wrapper.selectAll('.plot-grid-tick.y')
      .data(d3.range(base))
      .join('text')
      .style('fill', 'black')
      .attr('class', 'plot-grid-tick y')
      .attr('id', d => 'plot-grid-tick-y-' + d)
      .attr('y', d => yScale(d + 0.5) + '%')
      .attr('transform', 'translate(-12, 4)')
      .text(d => d)
      .style('display', d => base > 12 && d % 2 ? 'none' : '');

    let xTickData = [], prevColValue = -base;
    for (let i = 0; i < numCols; i++) {
      let currColValue;
      for (let j = 0; j < base; j++) {
        if (data[i * base + j]) {
          currColValue = Math.floor(data[i * base + j][0] / base) * base;
          break;
        }
      }
      if (currColValue === undefined) currColValue = prevColValue + base;
      xTickData.push(currColValue);
      prevColValue = currColValue;
    }
    wrapper.selectAll('.plot-grid-tick.x')
      .data(xTickData)
      .join('text')
      .style('fill', 'black')
      .attr('class', 'plot-grid-tick x')
      .attr('id', (_d, i) => 'plot-grid-tick-x-' + i)
      .attr('x', (_d, i) => xScale(i + 0.5) + '%')
      .attr('y', '100%')
      .attr('transform', 'translate(0, 12)')
      .text(d => d)
      .style('display', 'none');

    // create cells' mouse events
    cells.on('mouseenter', (e, d) => {
      let target = d3.select(e.currentTarget);
      const i = target.attr('id').substr('plot-grid-cell-'.length);

      // show the corresponding x-tick and y-tick
      wrapper.selectAll('.plot-grid-tick.y').style('display', 'none');
      const row = i % base;
      wrapper.select('#plot-grid-tick-y-' + row).style('display', '');
      if (d === null) return;
      if (!isHist) {
        const col = Math.floor(i / base);
        wrapper.select('#plot-grid-tick-x-' + col).style('display', '');
      }

      if (!d) return;
      // show the info about current number
      if (isHist) {
        const count = runningCounts[(numCols - 1) * base + row];
        InfoPanel.header(count)
          .text(' of the numbers appeared in the selected sequences have a')
          .text(` remainder of ${row} when divided by ${base}`)
          .newline()
          .text(`(${d3.format('.1%')(count / totalCount)}, ${
                  d3.format('.2')(count / totalCount * base)} in ${base})`,
            'black', true)
          .newline()
          .newline();
      } else {
        InfoPanel.header(d[0]);
      }
      for (let [index, occurrences] of d[1]) {
        const color = `hsl(${Util.generateColor(index, 0.5)})`
        if (isHist) InfoPanel.text(d[0], color, true);
        InfoPanel.text(isHist ? ' has appeared ' : 'Appeared ')
          .text(occurrences.length, color, true)
          .text(` time${occurrences.length > 1 ? 's' : ''} in sequence `)
          .text(sequenceData.get(index)['a_num'],
            `hsl(${Util.generateColor(index, 0.5)})`, true)
          .newline();
      }
      InfoPanel.show(target);
    });
    cells.on('mouseleave', (e, d) => {
      let target = d3.select(e.currentTarget);
      const i = +target.attr('id').substr('plot-grid-cell-'.length);

      // hide the corresponding x-tick and y-tick
      wrapper.selectAll('.plot-grid-tick.y')
        .style('display', d => base > 12 && d % 2 ? 'none' : '');
      if (d === null) return;
      if (!isHist) {
        const col = Math.floor(i / base);
        wrapper.select('#plot-grid-tick-x-' + col).style('display', 'none');
      }

      if (d) InfoPanel.hide();
    });

    return cells;
  }

  //#endregion

  //#region HEAT MAP -----------------------------------------------------------

  static parallel(elem, data, index, xExtent, yExtent, showInfo) {
    // metadata: the data of all points currently plotted;
    // settings: 'linear' for linear scale, some base index for log scale
    console.log(elem.datum());
    let [metadata, settings] = elem.datum();
    // const haveSettingsChanged = settings !=
    //  (plotMenu.isSelectableSelected('plot-scatter-menu-linear')
    //      ? 'linear'
    //      :
    //      plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider'));

    // if (haveSettingsChanged) {
    //  if (plotMenu.isSelectableSelected('plot-scatter-menu-linear')) {
    //    settings = 'linear';
    //  } else {
    //    settings =
    //      plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider');
    //  }
    //  elem.datum()[1] = settings;
    //}

    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    let wrapper = elem.select('#plot-data-wrapper-' + index);

    // if (!data && !haveSettingsChanged) {
    if (!data) {
      // user deselected, remove elements
      for (let xs of metadata.values())
        for (let ys of xs.values()) ys.delete(index);
      wrapper.classed('active', false)
        .selectAll('rect')
        .style('opacity', 1)
        .transition('fade')
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .style('opacity', 0)
        .on('end', () => wrapper.remove());
      wrapper.selectAll('circle').remove();
      wrapper.selectAll('path').remove();

      let available = elem.selectAll('.active')
      let curr = available.filter((d, i) => i == available.size() - 1);
      curr.selectAll('rect').style('opacity', 1)
      curr.selectAll('path').style('opacity', 1)
      // wrapper.selectAll('rect')
      //.filter(function(d) {
      //  return d3.select(this).attr('id') == ('rect-' + index);
      //})
      //  .remove()
      //  .remove()

      return;
    }

    if (index > 0) {
      let prevWrapper = elem.select('#plot-data-wrapper-' + (index - 1));
      prevWrapper.selectAll('rect')
        .filter(function(d) {
          return d3.select(this).attr('id') != 'middle';
        })
        .style('opacity', 0)
      prevWrapper.selectAll('path').style('opacity', 0)
    }

    // update metadata
    for (let x of data.x) {
      for (let y of data.y) {
        if (!metadata.has(x)) metadata.set(x, new Map());
        if (!metadata.get(x).has(y)) metadata.get(x).set(y, new Map());
        metadata.get(x).get(y).set(index, data);
      }
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index, 0.8333, 0.5)}, 0.5)`,
          emptyFillColor = `hsla(${Util.generateColor(index)}, 0)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`,
          maxMagnitude = data.magnitudes ? Math.max(...data.magnitudes) : 4;
    // if magnitudes not provided, default to every circle having radius
    // 1/2 of max radius.

    wrapper = elem.append('g')
                .attr('class', 'plot-data-elem plot-data-wrapper active')
                .attr('id', 'plot-data-wrapper-' + index)
                .datum(metadata);

    let xBand = d3.scaleBand()
                  .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
                  .range([1, 100])
                  .padding(0.01);

    let yBand = d3.scaleBand()
                  .domain([-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6])
                  .range([0, 100])
                  .padding(0.01);

    let xScatter =
      d3.scaleLinear().domain(d3.extent(data.x.map(d => d[2]))).range([1, 100])

    let triangleXScale =
      d3.scaleLinear().domain(d3.extent(data.x.map(d => d[2]))).range([
        plotWidth / 100, plotWidth
      ])
    let triangleYScale =
      d3.scaleLinear().domain([0, 100]).range([0, plotHeight]);

    let posExtent = d3.extent(data.x.filter(d => d[0] == 1).map(d => d[3]));
    let negExtent = d3.extent(data.x.filter(d => d[0] == -1).map(d => d[3]));

    let posColorScale = d3.scaleLinear().domain([0, posExtent[1]]).range([
      emptyFillColor, fillColor
    ]);
    let negColorScale = d3.scaleLinear().domain([0, negExtent[1]]).range([
      emptyFillColor, fillColor
    ]);

    if (index == 0) {
      let lines =
        [[0, yBand(0)], [101, yBand(0)], [101, yBand(1)], [0, yBand(1)]];
      wrapper.selectAll('line')
        .data(lines)
        .join('line')
        .attr('x1', (d, i) => lines[i][0] + '%')
        .attr('y1', (d, i) => lines[i][1] + '%')
        .attr('x2', (d, i) => lines[(i + 1) % 4][0] + '%')
        .attr('y2', (d, i) => lines[(i + 1) % 4][1] + '%')
        .style('stroke', 'gray')
        .style('stroke-width', '2px')
    }

    let triangle = d3.symbol().type(d3.symbolTriangle).size(150);

    wrapper.selectAll('rect')
      .data(data.x)
      .join('rect')
      .attr('x', d => xBand(d[1]) + xBand.bandwidth() / 2 + '%')
      .attr('y', d => yBand(d[0]) + yBand.bandwidth() / 2 + '%')
      .attr('width', '0%')
      .attr('height', '0%')
      .style('fill', d => d[0] < 0 ? negColorScale(d[3]) : posColorScale(d[3]))
      .on('mouseenter',
        (e, d) => {
          let target = d3.select(e.currentTarget);

          // [distToNeighbor, xIndex, neighbor, freq]
          const color = `hsl(${Util.generateColor(index, 0.5)})`;
          InfoPanel.header(d[2])
            .text('has persisted as a neighbor ')
            .text(Math.abs(d[0]), color, true)
            .text(' positions ')
            .text(d[0] < 0 ? 'before ' : 'after ')
            .text(data.rawData['num'], color, true)
            .text(' in any sequence ')
            .text(d[3], color, true)
            .text(' times')
            .show(target);
        })
      .on('mouseleave', () => InfoPanel.hide())
      .transition('fade')
      .ease(d3.easeSinOut)
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .duration(Functions.TRANSITION_DURATION)
      .attr('x', d => xBand(d[1]) + '%')
      .attr('y', d => yBand(d[0]) + '%')
      .attr('width', xBand.bandwidth() + '%')
      .attr('height', yBand.bandwidth() + '%');

    wrapper.selectAll('nothing')
      .data(data.x)
      .enter()
      .append('rect')
      .attr('x', d => xScatter(d[2]) + '%')
      .attr('y', (yBand(0) + 0.25) + '%')
      .attr('height', 7 + '%')
      .attr('width', 0.5 + '%')
      .attr('r', 6)
      .attr('id', 'middle')
      .style('fill', fillColor)
    // bottom triangle
    wrapper.selectAll('path')
      .data([0, 1])
      .join('path')
      .attr('d', triangle)
      .attr('transform',
        d => 'translate(' + triangleXScale(data.rawData.num) + ', ' +
          triangleYScale(yBand(1 - d)) + ') rotate(' + 180 * d + ')')
      .style('fill', 'black')
    // wrapper.selectAll('path')
    //  .data([0])
    //  .join('path')
    //  .attr('d', triangle)
    //  .attr('transform', 'translate(' + triangleXScale(data.rawData.num) + ',
    //  ' + triangleYScale(yBand(0)) + ')') .attr('transform', 'rotate(180)')
    //  .style('fill', 'black')
    wrapper.selectAll('circle')
      .data([data.rawData.num])
      .join('circle')
      .attr('cx', d => xScatter(+d) + '%')
      .attr('cy', '50%')
      .attr('r', 16)
      .style('fill', fillColor)

    return;
  }

  static parallelAxes(elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu) {
    Functions.scatterAxes(elem, title, xLabel, yLabel, xExtent, yExtent,
      plotMenu, Functions.parallel);
  }

  //#endregion

  //#region LINE ---------------------------------------------------------------

  static LINE_NODE_RADIUS = 6;

  static line(elem, data, index, xExtent, yExtent, showInfo, plotMenu) {
    /** @type {Map<number, Map<number, Plottable>>>} */
    let [metadata, settings] = elem.datum();
    const haveSettingsChanged = settings !=
      (plotMenu.isSelectableSelected('plot-scatter-menu-linear')
          ? 'linear'
          : plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider'));

    if (haveSettingsChanged) {
      if (plotMenu.isSelectableSelected('plot-scatter-menu-linear')) {
        settings = 'linear';
      } else {
        settings =
          plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider');
      }
      elem.datum()[1] = settings;
    }

    let wrapper = elem.select('#plot-data-wrapper-' + index);

    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    if (!data && !haveSettingsChanged) {
      // data is null: user deselected, remove elements
      for (let xs of metadata.values()) xs.delete(index);

      wrapper.classed('active', false)
        .style('opacity', 1)
        .transition('fade')
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove();

      return;
    }

    const xScale = d3.scaleLinear().domain(xExtent).range([0, plotWidth]);
    let yScale;
    if (settings == 'linear') {
      yScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]);
    } else {
      yScale = d3.scaleLog()
                 .base(Functions.SCATTER_LOG_BASES[settings][0])
                 .domain([Math.max(yExtent[0], Number.EPSILON), yExtent[1]])
                 .range([plotHeight, 0]);
    }

    const line = d3.line()
                   .x(d => xScale(d[0]))
                   .y(d => (yScale(d[1]) + 1 || plotHeight + 1) - 1)
                   .curve(d3.curveLinear);

    if (haveSettingsChanged) {
      // just updating the axis-scales
      elem.selectAll('.plot-line-path')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('d', line);
      elem.selectAll('.plot-line-node')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => (yScale(d[1]) + 1 || plotHeight + 1) - 1);

      return;
    }

    if (!wrapper.empty() && wrapper.classed('active')) {
      // extent has been changed: move the elements
      wrapper.selectAll('.plot-line-path')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('d', line);
      wrapper.selectAll('.plot-line-bar-clickable')
        .attr('x', d => xScale(d - 0.5))
        .attr('width', xScale(1) - xScale(0))
        .attr('height', plotHeight);
      wrapper.selectAll('.plot-line-node')
        .attr('cx', d => xScale(d[0]))
        .attr('cy', d => (yScale(d[1]) + 1 || plotHeight + 1) - 1);

      return;
    }

    // update metadata
    for (let x of data.x) {
      if (!metadata.has(x)) metadata.set(x, new Map());
      metadata.get(x).set(index, data);
    }

    // draw the new ones
    const strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g')
                .attr('class', 'plot-data-elem active')
                .attr('id', 'plot-data-wrapper-' + index);

    const unrolledData = data.x.map((x, i) => [x, data.y[i]]),
          clipPathId = Math.floor(Math.random() * (1 << 31));
    wrapper.append('path')
      .datum(unrolledData)
      .attr('class', 'plot-line-path')
      .attr('vector-effect', 'non-scaling-stroke')
      .style('fill', 'none')
      .style('stroke', strokeColor)
      .style('stroke-width', '2px')
      .style('z-order', '1728')
      .attr('d', line)
      .attr('clip-path', `url(#plot-line-clip-path-${clipPathId})`);
    wrapper.append('clipPath')
      .attr('id', 'plot-line-clip-path-' + clipPathId)
      .append('rect')
      .attr('width', '0%')
      .attr('height', '100%')
      .transition()
      .ease(d3.easeLinear)
      .duration(Functions.TOTAL_TRANSITION_DURATION)
      .attr('width', '100%');

    // assuming that the data is continuous i.e. d[i+1] = d[i]+1
    wrapper.selectAll('.plot-line-node')
      .data(unrolledData)
      .join('circle')
      .attr('class', 'plot-line-node')
      .attr('id', (_d, i) => 'plot-line-node-' + i)
      .style('fill', strokeColor)
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => (yScale(d[1]) + 1 || plotHeight + 1) - 1)
      .attr('r', 0);
    let clickables =
      wrapper.selectAll('.plot-line-bar-clickable')
        .data(data.x)
        .join('rect')
        .attr('class', 'plot-line-bar-clickable')
        .attr('id', (_d, i) => 'plot-line-bar-clickable-' + i)
        .style('opacity', 0)
        .attr('x', d => xScale(d - 0.5))
        .attr('y', 0)
        .attr('width', xScale(1) - xScale(0))
        .attr('height', plotHeight)
        .style('display', 'none')
        .on('mouseenter',
          e => {
            let target = d3.select(e.currentTarget);
            const i =
              +target.attr('id').substr('plot-line-bar-clickable-'.length);

            let node = elem.selectAll('#plot-line-node-' + i);
            node.attr('r', Functions.LINE_NODE_RADIUS);
            let info =
              Array.from(metadata.get(data.x[i])).map(x => x.concat(i));
            if (showInfo(info)) InfoPanel.show(node);
          })
        .on('mouseleave', e => {
          InfoPanel.hide();

          const i = +d3.select(e.currentTarget)
                       .attr('id')
                       .substr('plot-line-bar-clickable-'.length);
          elem.selectAll('#plot-line-node-' + i).attr('r', 0);
        });

    clickables.transition()
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .style('display', '');
  }

  static lineAxes(elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu) {
    Functions.scatterAxes(
      elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu, Functions.line);
  }

  //#endregion

  //#region SCATTER ------------------------------------------------------------

  /**
   * The radius of the dot representing the data item with the greatest
   * `magnitude` in a scatter plot.
   */
  static SCATTER_MAX_RADIUS = 12;

  static SCATTER_LOG_BASES = [
    [(Math.sqrt(5) + 1) / 2, 'φ'],
    [2, '2'],
    [Math.E, 'e'],
    [10, '10'],
  ];

  static scatter(elem, data, index, xExtent, yExtent, showInfo, plotMenu,
    isSloanes = false) {
    // metadata: the data of all points currently plotted;
    // settings: 'linear' for linear scale, some base index for log scale
    let [metadata, settings] = elem.datum();
    const haveSettingsChanged = settings !=
      (plotMenu.isSelectableSelected('plot-scatter-menu-linear')
          ? 'linear'
          : plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider'));
    if (haveSettingsChanged) {
      if (plotMenu.isSelectableSelected('plot-scatter-menu-linear')) {
        settings = 'linear';
      } else {
        settings =
          plotMenu.getSteppedSliderCurrStep('plot-scatter-menu-log-slider');
      }
      elem.datum()[1] = settings;
    }

    let wrapper = elem.select('#plot-data-wrapper-' + index);

    if (!data && !haveSettingsChanged) {
      // user deselected, remove elements
      for (let xs of metadata.values())
        for (let ys of xs.values()) ys.delete(index);

      wrapper.classed('active', false)
        .selectAll('circle')
        .transition('fade')
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .attr('r', 0)
        .on('end', () => wrapper.remove());

      return;
    }

    const xScale = d3.scaleLinear().domain(xExtent).range([0, 100]);
    let yScale;
    if (settings == 'linear') {
      yScale = d3.scaleLinear().domain(yExtent).range([100, 0]);
    } else {
      yScale = d3.scaleLog()
                 .base(Functions.SCATTER_LOG_BASES[settings][0])
                 .domain([Math.max(yExtent[0], 1), yExtent[1]])
                 .range([100, 0]);
    }

    if (haveSettingsChanged) {
      // just updating the axis-scales
      elem.selectAll('circle')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('cx', d => xScale(d[0]) + '%')
        .attr('cy', d => (yScale(d[1]) + 1 || 1201) - 1 + '%');

      return;
    }

    if (!wrapper.empty() && wrapper.classed('active')) {
      // extent has been changed: move the elements
      wrapper.selectAll('circle')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('cx', d => xScale(d[0]) + '%')
        .attr('cy', d => (yScale(d[1]) + 1 || 1201) - 1 + '%');

      return;
    }

    // update metadata
    for (let x of data.x) {
      for (let y of data.y) {
        if (!metadata.has(x)) metadata.set(x, new Map());
        if (!metadata.get(x).has(y)) metadata.get(x).set(y, new Map());
        metadata.get(x).get(y).set(index, data);
      }
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index)}, 0.3333)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`,
          maxMagnitude = data.magnitudes ? Math.max(...data.magnitudes) : 4;
    // if magnitudes not provided, default to every circle having radius
    // 1/2 of max radius.
    const rScale = d3.scaleSqrt().domain([0, maxMagnitude]).range([
      0, Functions.SCATTER_MAX_RADIUS
    ]);

    wrapper = elem.append('g')
                .attr('class', 'plot-data-elem plot-data-wrapper active')
                .attr('id', 'plot-data-wrapper-' + index)
                .datum(metadata);

    wrapper.selectAll('circle')
      .data(data.x.map((x, i) => [x, data.y[i]]))
      .join('circle')
      .attr('id', (_d, i) => 'plot-scatter-dot-' + i)
      .attr('cx', d => xScale(d[0]) + '%')
      .attr('cy', d => (yScale(d[1]) + 1 || 1201) - 1 + '%')
      .attr('r', 0)
      .style('fill', isSloanes ? strokeColor : fillColor)
      .style('stroke', isSloanes ? 'none' : strokeColor)
      .style('stroke-width', '1px')
      .style('z-order', '1728')
      .on('mouseenter',
        e => {
          let target = d3.select(e.currentTarget);
          const i = +target.attr('id').substr('plot-scatter-dot-'.length);

          let info =
            Array.from(metadata.get(data.x[i]).get(data.y[i]).entries())
              .map(x => x.concat(i));
          if (showInfo(info)) InfoPanel.show(target);
        })
      .on('mouseleave', () => InfoPanel.hide())
      .transition('fade')
      .ease(d3.easeElasticOut)
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .duration(Functions.TRANSITION_DURATION * 2)
      .attr('r',
        (_d, i) => rScale(data.magnitudes ? data.magnitudes[i] : 1) *
          (isSloanes ? 0.625 : 1));
  }

  /** @param {PlotMenu} plotMenu */
  static scatterAxes(elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu,
    plotData = Functions.scatter) {
    const isSloanes = title == PlotOptions.SLOANES_GAP.plotTitle,
          isParallel = title == PlotOptions.CONNECTIONS.plotTitle;
    // create menu if necessary
    if (!plotMenu.hasClasses('plot-setting') &&
      (!isParallel || !elem.datum())) {
      // TODO: get rid of this dirty check

      const update = () => {
        if (!isSloanes && !isParallel)
          plotData(elem, null, -1, xExtent, yExtent, null, plotMenu);
        Functions.scatterAxes(
          elem, title, xLabel, yLabel, xExtent, yExtent, plotMenu, plotData);
      }, selectLinear = () => {
        plotMenu.deselectSelectable('plot-scatter-menu-log')
          .selectSelectable('plot-scatter-menu-linear')
          .hideClasses('plot-setting-log');
        update();
      }, selectLog = () => {
        plotMenu.deselectSelectable('plot-scatter-menu-linear')
          .selectSelectable('plot-scatter-menu-log')
          .showClasses('plot-setting-log');
        update();
      }, changeLogBase = i => {
        plotMenu.setText('plot-scatter-menu-log-label',
          'Log Base: ' + Functions.SCATTER_LOG_BASES[i][1]);
        update();
      };

      plotMenu.appendDivider('plot-scatter-menu-divider')
        .appendSelectable('Linear Scale', 'plot-scatter-menu-linear',
          (_d, b) => !b && selectLinear())
        .appendSelectable('Logarithmic Scale', 'plot-scatter-menu-log',
          (_d, b) => !b && selectLog())
        .appendLabel(
          'Log Base: 10', 'plot-scatter-menu-log-label', 'plot-setting-log')
        .appendSteppedSlider([0, 25, 50, 100], 3,
          'plot-scatter-menu-log-slider', (_d, i) => changeLogBase(i),
          'plot-setting-log');

      // create metadata
      if (isSloanes || isParallel) {
        elem.datum([new Map(), 10]);
        plotMenu.removeId('plot-scatter-menu-divider')
          .removeId('plot-scatter-menu-linear')
          .removeId('plot-scatter-menu-log');
        if (isParallel) {
          plotMenu.clear();
          selectLinear();
        } else {
          selectLog();
        }
        plotData(elem, null, -1, xExtent, yExtent, null, plotMenu);
      } else {
        elem.datum([new Map(), 'linear']);
        selectLinear();
      }
    }

    // this function is called any time whenever there is a need to redraw the
    // axes
    const plotWidth = elem.property('clientWidth'),
          plotHeight = elem.property('clientHeight');

    // create scale for axis
    const xAxisScale = d3.scaleLinear().domain(xExtent).range([0, plotWidth]),
          xAxis = d3.axisBottom().scale(xAxisScale).ticks(5),
          isLinear = plotMenu.isSelectableSelected('plot-scatter-menu-linear');
    let yAxisScale;
    if (isLinear || isParallel) {
      if (isParallel) {
        if (!yExtent[0]) yExtent = [-6, 6];
        yExtent = [yExtent[0] - 0.5, yExtent[1] + 0.5];
      }
      yAxisScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]);
    } else {
      yAxisScale =
        d3.scaleLog()
          .base(Functions.SCATTER_LOG_BASES[plotMenu.getSteppedSliderCurrStep(
            'plot-scatter-menu-log-slider')][0])
          .domain([
            Math.max(
              yExtent[0], plotData == Functions.scatter ? 1 : Number.EPSILON),
            yExtent[1]
          ])
          .range([plotHeight, 0]);
    }
    let yAxis = d3.axisLeft().scale(yAxisScale).ticks(5);
    if (!isLinear && !isParallel)
      yAxis = yAxis.ticks(4).tickFormat(x => d3.format(',')(+x.toFixed(2)));
    else if (isParallel)
      yAxis = yAxis.tickFormat(x => x == 0 ? '' : x.toString());
    // plot axes
    elem.select('#plot-x-axis')
      .transition('move')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .call(xAxis);
    elem.select('#plot-y-axis')
      .classed('text-only-axis', isParallel)
      .transition('move')
      .ease(d3.easeSinOut)
      .duration(Functions.TRANSITION_DURATION)
      .call(yAxis);

    // show axis and title labels
    let tf = `translate(${plotWidth / 2}, ${plotHeight + 32})`;
    elem.select('#plot-x-label-text').attr('transform', tf).text(xLabel);

    const tickWidth = 6 *
      Math.max(...yExtent.map(
        x => (isLinear ? d3.format(',.2r')(x) : d3.format(',.2r')(x))
               .toString()
               .length));

    tf = `translate(${- 12 - tickWidth}, ${plotHeight / 2})`;
    let yLabelElem = elem.select('#plot-y-label-text');
    yLabelElem.text(yLabel);
    yLabelElem.transition('move')
      .ease(d3.easeSinOut)
      .duration(yLabelElem.attr('transform').includes('translate')
          ? Functions.TRANSITION_DURATION
          : 0)  // no transition for initial display to avoid being nifty
      .attr('transform', tf + ' rotate(-90)');

    tf = `translate(${plotWidth / 2}, -20)`;
    elem.select('#plot-title-text').attr('transform', tf).text(title);

    if (isParallel) elem.select('#plot-x-axis').html('');
  }

  //#endregion

  //#region SCATTER (sloane's gap) ---------------------------------------------

  static SLOANES_GAP_CIRCLE_RADIUS = 2.5;

  static scatterSloanesGap(
    elem, data, index, xExtent, yExtent, showInfo, plotMenu) {
    if (index >= 0) {
      Functions.scatter(
        elem, data, index, xExtent, yExtent, showInfo, plotMenu, true);

      return;
    }

    let wrapper = elem.select('#plot-data-wrapper-' + index);

    const xScale = d3.scaleLinear().domain(xExtent).range([0, 100]),
          yScale = d3.scaleLog().base(10).domain(yExtent).range([100, 0]);

    if (!wrapper.empty()) return;

    // draw the new ones
    const fillColor = `var(--gray-a-42)`;

    wrapper = elem.append('g')
                .attr('class', 'plot-data-elem plot-data-wrapper active')
                .attr('id', 'plot-data-wrapper-' + index);

    wrapper.selectAll('circle')
      .data(data.x.map((x, i) => [x, data.y[i]]))
      .join('circle')
      .attr('id', (_d, i) => 'plot-scatter-dot-' + i)
      .attr('cx', d => xScale(d[0]) + '%')
      .attr('cy', d => yScale(d[1]) + '%')
      .attr('r', 0)
      .style('fill', fillColor)
      .style('z-order', '1728')
      .on('mouseenter',
        e => {
          let target = d3.select(e.currentTarget);
          const i = +target.attr('id').substr('plot-scatter-dot-'.length);

          let info = [[-1, data, i]];
          if (showInfo(info)) InfoPanel.show(target);
        })
      .on('mouseleave', () => InfoPanel.hide())
      .transition('fade')
      .ease(d3.easeElasticOut)
      .delay(
        (_d, i) => i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
      .duration(Functions.TRANSITION_DURATION * 2)
      .attr('r', Functions.SLOANES_GAP_CIRCLE_RADIUS);
  }

  //#endregion

  //#endregion
}
