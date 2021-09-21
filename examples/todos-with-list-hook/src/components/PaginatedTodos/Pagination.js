const Pagination = ({ pages, page, setPage }) => {
  if (pages.length < 2) {
    return null;
  }

  return (
    <div>
      {pages.map(pageNo => (
        <div
          key={pageNo}
          className={`PaginatedTodos-page ${pageNo === page ? 'active' : ''}`}
          onClick={() => setPage(pageNo)}
        >
          {pageNo}
        </div>
      ))}
    </div>
  );
};

export default Pagination;