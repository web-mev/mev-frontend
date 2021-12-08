let _bins = this.bins;
      let selection = this.binGrp
          .selectAll('line')
          .data(_bins);

      selection.join(
          enter => enter
              .append('line')
              .style('stroke', 'grey')
              .style('stroke-width', 2)
              .attr('x1', d=>this.xScale(d))
              .attr('y1', this.yc-this.delta)
              .attr('x2', d=>this.xScale(d))
              .attr('y2', this.yc+this.delta),
          update => update
              .attr('x1', d=>this.xScale(d))
              .attr('y1', this.yc-this.delta)
              .attr('x2', d=>this.xScale(d))
              .attr('y2', this.yc+this.delta),
          exit => exit.remove()
      );

      let _binsLeftExtremum = [ _bins[0] ];
      selection = this.binEdgesLeftGrp
          .selectAll('path')
          .data(_binsLeftExtremum);

      selection.join(
          enter => enter
              .append('path')
              .attr('d', d=>{
                  return this.drawBracket(
                      d3.path(), 
                      'left', 
                      d)
                }
              )
              .style('stroke', 'grey')
              .style('stroke-width', 2)
              .style('fill', 'none'),

          update => update
            .attr('d', d=>{
                return this.drawBracket(
                    d3.path(), 
                    'left', 
                    d)
            }
          ),
          exit => exit.remove()
      );

      let _binsRightExtremum = [ _bins[_bins.length - 1] ];
      selection = this.binEdgesRightGrp
          .selectAll('path')
          .data(_binsRightExtremum);

      selection.join(
          enter => enter
              .append('path')
              .attr('d', d=>{
                  return this.drawBracket(
                      d3.path(), 
                      'right', 
                      d)
                }
              )
              .style('stroke', 'grey')
              .style('stroke-width', 2)
              .style('fill', 'none'),

          update => update
            .attr('d', d=>{
                return this.drawBracket(
                    d3.path(), 
                    'right', 
                    d)
            }
          ),
          exit => exit.remove()
      );