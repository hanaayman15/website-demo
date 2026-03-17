function Card({ title, children }) {
  return (
    <section className="ui-card">
      {title ? <h3>{title}</h3> : null}
      <div>{children}</div>
    </section>
  );
}

export default Card;
