import React from 'react';
import PropTypes from 'prop-types';

function getTarget(target) {
  if (target.className === "search-items") {
    return null;
  } else if (target.className === "search-item") {
    return target.innerText;
  }
}

const Item = ({ selected = false, children, click }) => {
  const label = !children ? "No Results" : children;
  return (
    <div
      className={selected ? "search-item-selected" : "search-item"}
      onClick={click}
    >
      {label}
    </div>
  );
};

Item.propTypes = {
  click: PropTypes.func,
  children: PropTypes.string,
  selected: PropTypes.bool
}

const SearchItems = ({ filteredCommands, click }) => {
  return (
    <div
      onClick={e => click(getTarget(e.target))}
      className="search-items"
    >
      <div className="search-results">
        {filteredCommands.length === 0 ?
          <Item selected={false} />
          : filteredCommands.map(label => (
            <Item
              key={label}
              selected={false}
            >
              {label}
            </Item>
          ))}
      </div>
    </div>
  );
};

SearchItems.propTypes = {
  click: PropTypes.func,
  filteredCommands: PropTypes.array,
  // children: PropTypes.arrayOf(PropTypes.element)
}

export default SearchItems;