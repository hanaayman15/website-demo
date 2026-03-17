function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div className="ui-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close modal">x</button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
