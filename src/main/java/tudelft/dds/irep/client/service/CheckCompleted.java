package tudelft.dds.irep.client.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

/**
 * Servlet implementation class CheckCompleted
 * Check in IREPlatform, located at http://ireplatform.ewi.tudelft.nl:8080, if the user has already completed the experiment.
 * 
 * @author mmarrero
 */
@WebServlet("/CheckCompleted")
public class CheckCompleted extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public CheckCompleted() {
        super();
    }

	/**
	 * Check in IREPlatform if an specific user (with idenfifier 'user') has already completed a specific experiment (with identifier 'idexperiment') 
	 * 
	 * @param request contains the parameters 'idexperiment' and 'user'
	 * @return string 'true' or 'false'
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String idexperiment = request.getParameter("idexperiment");
		String user = request.getParameter("user");
		final URL url = new URL("http://ireplatform.ewi.tudelft.nl:8080/IREPlatform/service/user/checkCompletedExp/"+idexperiment+"/"+user);
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("GET");
		conn.setRequestProperty("Content-length", "0");

		if (!(conn.getResponseCode() == 200  || conn.getResponseCode() == 201  || conn.getResponseCode() == 204)) {
			throw new RuntimeException("IREPlatform event registration endpoint failed. HTTP error code : " + conn.getResponseCode());
		}
		
        BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        String result = br.readLine();
        br.close();
        PrintWriter out = response.getWriter();
        out.write(result);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}
