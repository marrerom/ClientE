package tudelft.dds.irep.client.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
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
 * Servlet implementation class Register. 
 * Register the events sent by the client in IREPlatform, located at http://ireplatform.ewi.tudelft.nl:8080
 * 
 * @author mmarrero
 */
@WebServlet("/Register")
public class Register extends HttpServlet {
	private static final long serialVersionUID = 1L;

    public Register() {    }
    

	/**
	 * Receives the event sent by the client, decode it, and sent the event in JSON format to the platform to be registered.
	 * Throws exception if the response is different from 200, 201 or 204
	 * 
	 * @param request receives the encoded event contents in the body of the request
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		final URL url = new URL("http://ireplatform.ewi.tudelft.nl:8080/IREPlatform/service/event/register");
		BufferedReader br = new BufferedReader(new InputStreamReader(request.getInputStream()));
		String data = br.readLine();
		String stringEvent = URLDecoder.decode(data, "UTF-8");
		JSONObject inputJson = new JSONObject(stringEvent);
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("POST");
		conn.setRequestProperty( "Content-Type", "application/json" );
		conn.setRequestProperty("Accept", "application/json");
		conn.setDoInput(true);
		conn.setDoOutput(true);
		OutputStream os = conn.getOutputStream();
		OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
		osw.write(inputJson.toString());
		osw.flush();
		osw.close();

		if (!(conn.getResponseCode() == 200  || conn.getResponseCode() == 201  || conn.getResponseCode() == 204)) {
			throw new RuntimeException("IREPlatform event registration endpoint failed. HTTP error code : " + conn.getResponseCode());
		}
	}
	
	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}

}
