function SectionCard({ as = 'section', className = '', style = {}, children }) {
  const Component = as;
  return (
    <Component className={`react-panel react-grid ${className}`.trim()} style={style}>
      {children}
    </Component>
  );
}

export default SectionCard;
