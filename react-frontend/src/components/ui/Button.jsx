function Button({ type = 'button', onClick, children, ...props }) {
  return (
    <button type={type} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export default Button;
