import React from 'react';

const Item = ({
  type,
  setFilter,
  filter,
  children,
}) => (
  <span
    className={`Filter-item ${filter === type? 'active' : ''}`}
    onClick={() => setFilter(type)}
  >
    {children}
  </span>
);

const Filters = ({ filter, setFilter }) => {
  return (
    <div className="Filters-container">
      <Item {...{ filter, setFilter, type: 'pending' }}>Pending</Item>
      <Item {...{ filter, setFilter, type: 'complete' }}>Complete</Item>
      <Item {...{ filter, setFilter, type: 'all' }}>All</Item>
    </div>
  );
};

export default Filters;
