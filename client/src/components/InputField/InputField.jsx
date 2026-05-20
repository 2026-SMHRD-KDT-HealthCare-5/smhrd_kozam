import "./InputField.css";

const InputField = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  helper,
  sideHelper,
  action,
  type = "text",
}) => {
  return (
    <label className="field-block">
      <span>{label}</span>
      <div className="field-box">
        {icon}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        {action}
      </div>
      {(helper || sideHelper) && (
        <small>
          {helper}
          <b>{sideHelper}</b>
        </small>
      )}
    </label>
  );
};

export default InputField;
