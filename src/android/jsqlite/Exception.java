package jsqlite;

/**
 * Class for SQLite related exceptions.
 */

public class Exception extends java.lang.Exception {
  private static final long serialVersionUID = 6404151883862370052L;

    /**
     * Construct a new SQLite exception.
     *
     * @param string error message
     */

    public Exception(String string) {
	super(string);
    }
}
