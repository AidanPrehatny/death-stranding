import React, { Component } from 'react';
import Network from './Network/Network';
import Menu from './Menu/Menu'
import Search from './Search/Search';
// import Button from './button';

const RESIZE_DELAY = 100; // 100ms

class App extends Component {

  constructor(props) {
    super(props);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.resizeEnd = null;
    this.state = {
      dimensions: {
        width,
        height
      },
      focus: null,
      loading: true
    };
  }

  resize = () => {
    console.log("resize");
    this.setState({
      dimensions: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  onResize = () => {
    clearTimeout(this.resizeEnd);
    this.resizeEnd = setTimeout(this.resize, RESIZE_DELAY);
  }

  componentDidMount() {
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  renderMenu = ({ nodes, loading, searchRef }) => {
    return (
      <Menu loading={loading}>
        <Search
          searchRef={searchRef}
          nodes={nodes}
        />
      </Menu>
    );
  }

  render() {
    const { width, height } = this.state.dimensions;
    return (
      <div style={{ width, height }}>
        <Network
          width={width}
          height={height}
          renderMenu={this.renderMenu}
        />
        {/* <div style={{ position: 'absolute', zIndex: '9999', bottom: "5px", left: "5px" }}>
        <p style={{ textAlign: 'center' }}>Focus Test</p>
        <div>
          <Button
            click={() => this.focusNode("?4an3p8ptn")}
            disabled={this.state.focus === "?4an3p8ptn"}
            node="?4an3p8ptn"
          />
          <Button
            click={() => this.focusNode("?onethousandfivehundred")}
            disabled={this.state.focus === "?onethousandfivehundred"}
            node="?onethousandfivehundred"
          />
          <Button
            click={() => this.focusNode("?tearsinrain")}
            disabled={this.state.focus === "?tearsinrain"}
            node="?tearsinrain"
          />
          <Button
            click={() => this.focusNode("?thatgamecompany")}
            disabled={this.state.focus === "?thatgamecompany"}
            node="?thatgamecompany"
          />
        </div> */}
      </div >
    );
  }
}

export default App;
